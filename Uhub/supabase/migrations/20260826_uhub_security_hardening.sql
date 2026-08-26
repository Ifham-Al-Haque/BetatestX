-- UHub security hardening
-- Run in Supabase SQL Editor (project qtugowosurgecytgswuo). Safe to re-run.
--
-- What this does:
--   * Privilege helpers live in schema `private` (not callable as Data API RPCs).
--   * users: no self-promotion; INSERT/DELETE admin-only; role/status locked by trigger.
--   * employees: writes for HR/admin; people may update their own non-privileged fields.
--   * invite_user / accept_invitation / notification RPCs require a real caller and
--     cannot mint admin access from a normal UHub login.
--   * notifications: no direct INSERT from the Data API.
--   * Open USING (true) write policies on ops/collection/fleet tables are replaced
--     with role-scoped policies.
--   * Storage writes on driver buckets are staff-or-owner, not every login.
--
-- What you must still do in the dashboard:
--   Authentication → disable public signup (invite / admin-created accounts only).
--   Edge Functions → JWT verification ON for send-email and send-push.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.jwt_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(btrim(COALESCE(auth.jwt() ->> 'email', '')));
$$;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(u.role::text)
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND (u.status IS NULL OR lower(u.status::text) = 'active')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.role_in(VARIADIC roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.current_user_role() = ANY (
    SELECT lower(r) FROM unnest(roles) AS r
  );
$$;

CREATE OR REPLACE FUNCTION private.is_uhub_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.role_in('admin', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION private.is_hr_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.role_in('admin', 'super_admin', 'hr_manager');
$$;

CREATE OR REPLACE FUNCTION private.is_it_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.role_in('admin', 'super_admin', 'it_management', 'it_manager', 'it_technician', 'it');
$$;

CREATE OR REPLACE FUNCTION private.is_ops_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.role_in(
    'admin', 'super_admin', 'operation_management', 'driver_management',
    'manager', 'iot_management'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_finance_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.role_in('admin', 'super_admin', 'finance', 'finance_viewer');
$$;

CREATE OR REPLACE FUNCTION private.can_manage_invites()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.is_hr_staff();
$$;

REVOKE ALL ON FUNCTION private.jwt_email() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.role_in(TEXT[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_uhub_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_hr_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_it_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_ops_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_finance_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_manage_invites() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.jwt_email() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.role_in(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_uhub_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_hr_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_it_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_ops_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_finance_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_invites() TO authenticated;

-- ---------------------------------------------------------------------------
-- users: stop privilege escalation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.protect_users_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('uhub.allow_account_write', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.is_uhub_admin() THEN
      RAISE EXCEPTION 'Only administrators can create UHub user accounts'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT private.is_uhub_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You cannot change UHub roles'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'You cannot change UHub account status'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
      RAISE EXCEPTION 'You cannot re-link a UHub login'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
      RAISE EXCEPTION 'You cannot re-link the employee record from the client'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'You cannot change account email from the client'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_users_privileges ON public.users;
CREATE TRIGGER trg_protect_users_privileges
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_users_privileges();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY users_select_authenticated
  ON public.users FOR SELECT TO authenticated
  USING (true);

CREATE POLICY users_insert_admin
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (private.is_uhub_admin());

CREATE POLICY users_update_self
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY users_update_admin
  ON public.users FOR UPDATE TO authenticated
  USING (private.is_uhub_admin())
  WITH CHECK (private.is_uhub_admin());

CREATE POLICY users_delete_admin
  ON public.users FOR DELETE TO authenticated
  USING (private.is_uhub_admin());

REVOKE ALL ON public.users FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;

-- ---------------------------------------------------------------------------
-- employees: HR writes; own-row non-privileged updates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.protect_employees_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_setting('uhub.allow_account_write', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT private.is_hr_staff() THEN
      RAISE EXCEPTION 'Only HR or administrators can create employee records'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT private.is_hr_staff() THEN
    IF NEW.department IS DISTINCT FROM OLD.department
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       OR (to_jsonb(NEW) ? 'employee_id' AND NEW.employee_id IS DISTINCT FROM OLD.employee_id)
       OR (to_jsonb(NEW) ? 'position' AND NEW.position IS DISTINCT FROM OLD.position)
       OR (to_jsonb(NEW) ? 'designation' AND (to_jsonb(NEW)->>'designation') IS DISTINCT FROM (to_jsonb(OLD)->>'designation'))
       OR (to_jsonb(NEW) ? 'reporting_manager_id' AND NEW.reporting_manager_id IS DISTINCT FROM OLD.reporting_manager_id)
       OR (to_jsonb(NEW) ? 'salary' AND NEW.salary IS DISTINCT FROM OLD.salary)
       OR (to_jsonb(NEW) ? 'hire_date' AND NEW.hire_date IS DISTINCT FROM OLD.hire_date)
    THEN
      RAISE EXCEPTION 'You cannot change privileged employee fields'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_employees_privileges ON public.employees;
CREATE TRIGGER trg_protect_employees_privileges
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_employees_privileges();

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'employees'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.employees', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY employees_select_authenticated
  ON public.employees FOR SELECT TO authenticated
  USING (true);

CREATE POLICY employees_insert_hr
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (private.is_hr_staff());

CREATE POLICY employees_update_hr
  ON public.employees FOR UPDATE TO authenticated
  USING (private.is_hr_staff())
  WITH CHECK (private.is_hr_staff());

CREATE POLICY employees_update_own
  ON public.employees FOR UPDATE TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR lower(COALESCE(email, '')) = private.jwt_email()
    OR id::text = (
      SELECT u.employee_id::text
      FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR lower(COALESCE(email, '')) = private.jwt_email()
    OR id::text = (
      SELECT u.employee_id::text
      FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY employees_delete_hr
  ON public.employees FOR DELETE TO authenticated
  USING (private.is_hr_staff());

REVOKE ALL ON public.employees FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;

-- ---------------------------------------------------------------------------
-- Claim an existing UHub account on first login (no self-provisioning)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_uhub_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := private.jwt_email();
  v_user public.users%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  PERFORM set_config('uhub.allow_account_write', 'on', true);
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Login has no email' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_user
  FROM public.users u
  WHERE u.auth_user_id = v_uid
  LIMIT 1;

  IF v_user.id IS NULL THEN
    SELECT * INTO v_user
    FROM public.users u
    WHERE lower(btrim(u.email)) = v_email
    LIMIT 1
    FOR UPDATE;

    IF v_user.id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No UHub account is provisioned for this login. Ask an administrator to invite you.'
      );
    END IF;

    IF v_user.auth_user_id IS NOT NULL AND v_user.auth_user_id IS DISTINCT FROM v_uid THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'This email is already linked to a different login.'
      );
    END IF;

    UPDATE public.users
    SET auth_user_id = v_uid
    WHERE id = v_user.id
    RETURNING * INTO v_user;
  END IF;

  IF v_user.status IS NOT NULL AND lower(v_user.status::text) <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This UHub account is inactive.');
  END IF;

  IF v_user.employee_id IS NULL THEN
    UPDATE public.users u
    SET employee_id = e.id
    FROM public.employees e
    WHERE u.id = v_user.id
      AND e.email IS NOT NULL
      AND lower(btrim(e.email)) = v_email
    RETURNING u.* INTO v_user;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'auth_user_id', v_user.auth_user_id,
      'employee_id', v_user.employee_id,
      'email', v_user.email,
      'role', v_user.role,
      'status', v_user.status
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_uhub_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_uhub_account() TO authenticated;

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'invite_user', 'accept_invitation', 'get_invitation_by_token',
        'get_pending_invitations', 'delete_invitation', 'cleanup_expired_invitations'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.invite_user(
  invite_email TEXT,
  invite_role TEXT DEFAULT 'employee',
  invite_department TEXT DEFAULT 'Unassigned',
  invite_position TEXT DEFAULT 'Employee',
  inviter_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
  invitation_id BIGINT;
  v_role TEXT := lower(btrim(COALESCE(invite_role, 'employee')));
  allowed TEXT[] := ARRAY[
    'employee', 'data_operator', 'finance', 'finance_viewer', 'it_management',
    'it_manager', 'it_technician', 'it', 'manager', 'driver_management',
    'operation_management', 'hr_manager', 'cs_manager', 'iot_management',
    'admin', 'super_admin'
  ];
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_manage_invites() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to invite users');
  END IF;

  IF v_role = ANY (ARRAY['admin', 'super_admin']) AND NOT private.is_uhub_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Only administrators can invite admin users');
  END IF;

  IF v_role IS NULL OR NOT (v_role = ANY (allowed)) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  IF invite_email IS NULL OR position('@' IN invite_email) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'A valid email is required');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.users u
    WHERE lower(btrim(u.email)) = lower(btrim(invite_email))
  ) THEN
    RETURN json_build_object('success', false, 'error', 'A UHub user with this email already exists');
  END IF;

  new_token := 'inv_' || gen_random_uuid()::text;

  INSERT INTO invitations (
    email, role, department, "position", token, status, inviter_id,
    created_at, expires_at, invited_at, requested_at
  ) VALUES (
    btrim(invite_email),
    v_role,
    COALESCE(invite_department, 'Unassigned'),
    COALESCE(invite_position, 'Employee'),
    new_token,
    'pending',
    auth.uid(),
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  ) RETURNING id INTO invitation_id;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', invitation_id,
      'email', btrim(invite_email),
      'role', v_role,
      'department', COALESCE(invite_department, 'Unassigned'),
      'position', COALESCE(invite_position, 'Employee'),
      'token', new_token,
      'expires_at', NOW() + INTERVAL '7 days'
    )
  );
EXCEPTION
  WHEN undefined_column OR undefined_table THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token TEXT)
RETURNS TABLE (
  id INTEGER,
  email TEXT,
  role TEXT,
  department TEXT,
  "position" TEXT,
  token TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id::integer,
    i.email::text,
    i.role::text,
    i.department::text,
    i."position"::text,
    i.token::text,
    i.status::text,
    i.expires_at
  FROM invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$;

-- Password is never accepted here. Sign up in Auth first, then call this
-- while authenticated; or call it before login and claim_uhub_account after.
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token TEXT,
  user_full_name TEXT,
  user_phone TEXT DEFAULT NULL,
  user_location TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_data RECORD;
  new_user_id UUID;
  new_employee_id UUID;
  v_auth UUID := auth.uid();
BEGIN
  SELECT * INTO invitation_data
  FROM invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  PERFORM set_config('uhub.allow_account_write', 'on', true);

  IF v_auth IS NOT NULL AND private.jwt_email() <> lower(btrim(invitation_data.email)) THEN
    RETURN json_build_object('success', false, 'error', 'This invitation is for a different email address');
  END IF;

  SELECT u.id INTO new_user_id
  FROM public.users u
  WHERE lower(btrim(u.email)) = lower(btrim(invitation_data.email))
  LIMIT 1;

  IF new_user_id IS NULL THEN
    INSERT INTO public.users (email, role, status, auth_user_id, created_at, updated_at)
    VALUES (
      invitation_data.email,
      invitation_data.role,
      'active',
      v_auth,
      NOW(),
      NOW()
    )
    RETURNING id INTO new_user_id;
  ELSIF v_auth IS NOT NULL THEN
    UPDATE public.users
    SET auth_user_id = COALESCE(auth_user_id, v_auth),
        role = invitation_data.role,
        status = 'active'
    WHERE id = new_user_id;
  END IF;

  SELECT e.id INTO new_employee_id
  FROM public.employees e
  WHERE e.email IS NOT NULL
    AND lower(btrim(e.email)) = lower(btrim(invitation_data.email))
  LIMIT 1;

  IF new_employee_id IS NULL THEN
    INSERT INTO public.employees (full_name, email, department, "position", phone, location, status, auth_user_id)
    VALUES (
      COALESCE(NULLIF(btrim(user_full_name), ''), split_part(invitation_data.email, '@', 1)),
      invitation_data.email,
      COALESCE(invitation_data.department, 'Unassigned'),
      COALESCE(invitation_data."position", 'Employee'),
      user_phone,
      user_location,
      'active',
      v_auth
    )
    RETURNING id INTO new_employee_id;
  END IF;

  UPDATE public.users SET employee_id = new_employee_id WHERE id = new_user_id;

  UPDATE invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = new_user_id
  WHERE token = invitation_token;

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'user_id', new_user_id,
      'employee_id', new_employee_id,
      'email', invitation_data.email,
      'role', invitation_data.role
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS SETOF invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_manage_invites() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT * FROM invitations
  WHERE status = 'pending'
  ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_invitation(invitation_id INTEGER, deleter_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT private.can_manage_invites() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  DELETE FROM invitations WHERE id = invitation_id;
  RETURN json_build_object('success', true, 'message', 'Invitation deleted successfully');
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT private.is_uhub_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  DELETE FROM invitations WHERE expires_at < NOW() AND status = 'pending';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN json_build_object('success', true, 'deleted_count', deleted_count);
END;
$$;

REVOKE ALL ON FUNCTION public.invite_user(TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_invitation(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_pending_invitations() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_invitation(INTEGER, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_invitations() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.invite_user(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_invitation(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations() TO authenticated;

DO $$
DECLARE pol record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invitations') THEN
    ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'invitations'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.invitations', pol.policyname);
    END LOOP;
  END IF;
END $$;

DROP POLICY IF EXISTS invitations_staff_all ON public.invitations;
CREATE POLICY invitations_staff_all
  ON public.invitations FOR ALL TO authenticated
  USING (private.can_manage_invites())
  WITH CHECK (private.can_manage_invites());

REVOKE ALL ON public.invitations FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_notification', 'create_notifications_for_users', 'create_notifications_for_role'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  v_url TEXT := p_action_url;
  v_message TEXT := left(COALESCE(p_message, ''), 4000);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'user_id and title are required' USING ERRCODE = '22023';
  END IF;
  IF v_url IS NOT NULL AND v_url !~ '^/' THEN
    v_url := NULL;
  END IF;

  INSERT INTO notifications (
    user_id, type, title, message, data, priority,
    action_url, action_label, expires_at
  ) VALUES (
    p_user_id, p_type, left(p_title, 255), v_message, COALESCE(p_data, '{}'::jsonb),
    COALESCE(p_priority, 'medium'), v_url, p_action_label, p_expires_at
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_notifications_for_users(
  p_user_ids UUID[],
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  notification_count INTEGER := 0;
  v_ids UUID[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_ids IS NULL THEN
    RETURN 0;
  END IF;
  v_ids := p_user_ids[1:50];
  FOREACH uid IN ARRAY v_ids
  LOOP
    IF uid IS NOT NULL THEN
      PERFORM public.create_notification(
        uid, p_type, p_title, p_message, p_data,
        p_priority, p_action_url, p_action_label, p_expires_at
      );
      notification_count := notification_count + 1;
    END IF;
  END LOOP;
  RETURN notification_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_notifications_for_role(
  p_role VARCHAR(50),
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_ids UUID[];
  v_role TEXT := lower(btrim(COALESCE(p_role, '')));
  allowed TEXT[] := ARRAY[
    'admin', 'super_admin', 'hr_manager', 'it_management',
    'it_manager', 'it_technician', 'it'
  ];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF v_role <> ALL (allowed) THEN
    RAISE EXCEPTION 'Role fan-out is not allowed for %', p_role USING ERRCODE = '42501';
  END IF;

  SELECT ARRAY_AGG(DISTINCT u.auth_user_id)
  INTO user_ids
  FROM public.users u
  WHERE lower(u.role::text) = v_role
    AND u.auth_user_id IS NOT NULL
    AND (u.status IS NULL OR lower(u.status::text) = 'active');

  RETURN public.create_notifications_for_users(
    user_ids, p_type, p_title, p_message, p_data,
    p_priority, p_action_url, p_action_label, p_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notifications_for_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notifications_for_role TO authenticated;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_delete_own
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

REVOKE INSERT ON public.notifications FROM authenticated, anon, PUBLIC;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

-- ---------------------------------------------------------------------------
-- Operational tables that were USING (true)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.replace_open_table_policies(p_table TEXT, p_write_check TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pol record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = p_table
  ) THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p_table);

  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, p_table);
  END LOOP;

  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',
    p_table || '_select_staff', p_table, p_write_check
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)',
    p_table || '_insert_staff', p_table, p_write_check
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)',
    p_table || '_update_staff', p_table, p_write_check, p_write_check
  );
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)',
    p_table || '_delete_staff', p_table, p_write_check
  );

  EXECUTE format('REVOKE ALL ON public.%I FROM anon, PUBLIC', p_table);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', p_table);
END;
$$;

SELECT private.replace_open_table_policies(t, 'private.is_ops_staff()')
FROM unnest(ARRAY[
  'operation_teams',
  'operation_team_members',
  'operation_shifts',
  'operation_roster_entries',
  'fleet_vehicle_documents',
  'udrive_access',
  'iot_records'
]) AS t;

SELECT private.replace_open_table_policies(
  t,
  '(private.is_ops_staff() OR private.is_finance_staff())'
)
FROM unnest(ARRAY[
  'collection_payments',
  'collection_reminders',
  'collection_cases',
  'rental_agreements'
]) AS t;

SELECT private.replace_open_table_policies(t, 'private.is_ops_staff()')
FROM unnest(ARRAY[
  'ltr_customer_review',
  'ltr_customer_lead',
  'ltr_reporting'
]) AS t;

-- ---------------------------------------------------------------------------
-- Storage: driver buckets
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    DROP POLICY IF EXISTS "Driver profiles full access for authenticated" ON storage.objects;
    DROP POLICY IF EXISTS "Driver documents full access for authenticated" ON storage.objects;
    DROP POLICY IF EXISTS "driver-profiles full access for authenticated" ON storage.objects;
    DROP POLICY IF EXISTS "driver-documents full access for authenticated" ON storage.objects;

    DROP POLICY IF EXISTS driver_profiles_select ON storage.objects;
    DROP POLICY IF EXISTS driver_profiles_write_own ON storage.objects;
    DROP POLICY IF EXISTS driver_profiles_write_staff ON storage.objects;
    DROP POLICY IF EXISTS driver_documents_select ON storage.objects;
    DROP POLICY IF EXISTS driver_documents_write_own ON storage.objects;
    DROP POLICY IF EXISTS driver_documents_write_staff ON storage.objects;

    CREATE POLICY driver_profiles_select ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id IN ('driver-profiles', 'driver-documents'));

    CREATE POLICY driver_profiles_write_own ON storage.objects
      FOR ALL TO authenticated
      USING (
        bucket_id IN ('driver-profiles', 'driver-documents')
        AND owner = auth.uid()
      )
      WITH CHECK (
        bucket_id IN ('driver-profiles', 'driver-documents')
        AND owner = auth.uid()
      );

    CREATE POLICY driver_profiles_write_staff ON storage.objects
      FOR ALL TO authenticated
      USING (
        bucket_id IN ('driver-profiles', 'driver-documents')
        AND (private.is_ops_staff() OR private.is_hr_staff())
      )
      WITH CHECK (
        bucket_id IN ('driver-profiles', 'driver-documents')
        AND (private.is_ops_staff() OR private.is_hr_staff())
      );
  END IF;
END $$;

REVOKE ALL ON FUNCTION private.replace_open_table_policies(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;
REVOKE ALL ON FUNCTION private.replace_open_table_policies(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- IT request assignment notifications: diagnose + fix
-- Run the whole file in Supabase SQL Editor. Safe to re-run.
--
-- Covers the 3 causes of "assignee gets no bell notification":
--   1. create_notification RPC broken (duplicate overloads → PGRST203)
--   2. notifications RLS blocking insert/select
--   3. users.auth_user_id missing for the assignee (e.g. Talha)
-- Plus: realtime publication for live popups.
-- ============================================================

-- ---------- DIAGNOSE ----------

-- 1) RPC overloads — more than one row per function name = broken (PGRST203)
SELECT p.proname, p.oid::regprocedure AS signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('create_notification', 'create_notifications_for_users', 'create_notifications_for_role');

-- 2) IT staff / users missing the auth link (these users can NEVER see bell notifications)
SELECT id, full_name, email, role, auth_user_id
FROM users
WHERE auth_user_id IS NULL;

-- 3) Recent notifications — check if assignment rows were created at all and with which user_id
SELECT id, user_id, type, title, created_at
FROM notifications
WHERE type IN ('it_request_assigned', 'it_request', 'it_request_update')
ORDER BY created_at DESC
LIMIT 20;

-- 4) Current RLS policies on notifications
SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS check_expr
FROM pg_policy
WHERE polrelid = 'public.notifications'::regclass;

-- ---------- FIX 1: recreate notification RPCs (single overload, SECURITY DEFINER) ----------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS func
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('create_notification', 'create_notifications_for_users', 'create_notifications_for_role')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func || ' CASCADE';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION create_notification(
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
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, data, priority,
    action_url, action_label, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_priority,
    p_action_url, p_action_label, p_expires_at
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_notifications_for_users(
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
BEGIN
  IF p_user_ids IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH uid IN ARRAY p_user_ids
  LOOP
    IF uid IS NOT NULL THEN
      PERFORM create_notification(
        uid, p_type, p_title, p_message, p_data,
        p_priority, p_action_url, p_action_label, p_expires_at
      );
      notification_count := notification_count + 1;
    END IF;
  END LOOP;

  RETURN notification_count;
END;
$$;

CREATE OR REPLACE FUNCTION create_notifications_for_role(
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
BEGIN
  SELECT ARRAY_AGG(DISTINCT u.auth_user_id)
  INTO user_ids
  FROM public.users u
  WHERE u.role = p_role
    AND u.auth_user_id IS NOT NULL
    AND (u.status IS NULL OR u.status = 'active');

  RETURN create_notifications_for_users(
    user_ids, p_type, p_title, p_message, p_data,
    p_priority, p_action_url, p_action_label, p_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notifications_for_users TO authenticated;
GRANT EXECUTE ON FUNCTION create_notifications_for_role TO authenticated;

-- ---------- FIX 2: notifications RLS (read own; allow authenticated inserts as fallback) ----------

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allows the app's direct-insert fallback (e.g. assigner creating a row for the assignee)
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;
CREATE POLICY "notifications_insert_authenticated" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ---------- FIX 3: link users.auth_user_id by email where missing ----------
-- Matches public.users to auth.users by email. Review result of the diagnose query first.

UPDATE users u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.auth_user_id IS NULL
  AND lower(u.email) = lower(au.email);

-- Re-check: should return 0 rows for active staff
SELECT id, full_name, email, role
FROM users
WHERE auth_user_id IS NULL;

-- ---------- FIX 4: realtime for live popups (bell works without this; popups need it) ----------

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE it_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- UPDATE events need old row values for the assignee-change detection in the app
ALTER TABLE it_requests REPLICA IDENTITY FULL;

-- ---------- VERIFY ----------

-- Test: create a notification for a specific user (replace the UUID with Talha's auth_user_id)
-- SELECT create_notification(
--   '<talha-auth-user-id>'::uuid,
--   'it_request_assigned', 'Test Assignment',
--   'If you can see this in the bell after refresh, notifications work.'
-- );

SELECT 'Setup complete' AS status,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'create_notification') AS create_notification_overloads,
  (SELECT COUNT(*) FROM users WHERE auth_user_id IS NULL) AS users_missing_auth_link;

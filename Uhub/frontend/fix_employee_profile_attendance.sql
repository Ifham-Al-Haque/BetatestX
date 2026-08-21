-- Let the linked UHub user see their own punches on the employee profile.
-- Also match by email / auth / staff code, not only users.employee_id.

CREATE OR REPLACE FUNCTION public.resolve_employee_id_for_uhub_user(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_emp_id UUID;
BEGIN
  SELECT u.id, u.email, u.auth_user_id, u.employee_id
  INTO v_user
  FROM public.users u
  WHERE u.id = p_user_id
  LIMIT 1;
  IF v_user.id IS NULL THEN
    RETURN NULL;
  END IF;
  IF v_user.employee_id IS NOT NULL THEN
    SELECT e.id INTO v_emp_id FROM public.employees e WHERE e.id::text = v_user.employee_id::text LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;
  END IF;
  IF v_user.auth_user_id IS NOT NULL THEN
    SELECT e.id INTO v_emp_id FROM public.employees e WHERE e.auth_user_id = v_user.auth_user_id LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;
  END IF;
  IF v_user.email IS NOT NULL AND btrim(v_user.email) <> '' THEN
    SELECT e.id INTO v_emp_id FROM public.employees e
    WHERE e.email IS NOT NULL AND lower(e.email) = lower(v_user.email) LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_for_employee(
  p_employee_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_me public.users%ROWTYPE;
  v_emp RECORD;
  v_link TEXT;
  v_days JSONB;
  v_is_self BOOLEAN := FALSE;
  v_resolved UUID;
BEGIN
  SELECT e.id, e.auth_user_id, e.email, e.employee_id
  INTO v_emp
  FROM public.employees e
  WHERE e.id = p_employee_id;

  IF v_emp.id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'days', '[]'::jsonb);
  END IF;

  SELECT u.* INTO v_me
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_me.id IS NOT NULL THEN
    v_resolved := public.resolve_employee_id_for_uhub_user(v_me.id);
    IF v_resolved = p_employee_id
       OR v_me.employee_id::text = p_employee_id::text
       OR (v_emp.employee_id IS NOT NULL AND v_me.employee_id::text = v_emp.employee_id::text)
       OR (v_emp.auth_user_id IS NOT NULL AND v_me.auth_user_id = v_emp.auth_user_id)
       OR (v_emp.email IS NOT NULL AND lower(v_me.email) = lower(v_emp.email))
    THEN
      v_is_self := TRUE;
      v_user := v_me;
      v_link := 'own UHub account';
    END IF;
  END IF;

  IF NOT public.is_employee_attendance_viewer() AND NOT v_is_self THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  IF v_user.id IS NULL THEN
    SELECT u.* INTO v_user
    FROM public.users u
    WHERE u.employee_id::text = p_employee_id::text
    LIMIT 1;
    IF FOUND THEN
      v_link := 'users.employee_id';
    END IF;
  END IF;

  IF v_user.id IS NULL AND v_emp.auth_user_id IS NOT NULL THEN
    SELECT u.* INTO v_user
    FROM public.users u
    WHERE u.auth_user_id = v_emp.auth_user_id
    LIMIT 1;
    IF FOUND THEN
      v_link := 'employees.auth_user_id';
    END IF;
  END IF;

  IF v_user.id IS NULL AND v_emp.email IS NOT NULL AND btrim(v_emp.email) <> '' THEN
    SELECT u.* INTO v_user
    FROM public.users u
    WHERE lower(u.email) = lower(v_emp.email)
    LIMIT 1;
    IF FOUND THEN
      v_link := 'email';
    END IF;
  END IF;

  IF v_user.id IS NULL AND v_emp.employee_id IS NOT NULL THEN
    SELECT u.* INTO v_user
    FROM public.users u
    WHERE u.employee_id::text = v_emp.employee_id::text
    LIMIT 1;
    IF FOUND THEN
      v_link := 'staff_code';
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.work_date DESC), '[]'::jsonb)
  INTO v_days
  FROM public.user_attendance_days d
  WHERE d.work_date >= p_from
    AND d.work_date <= p_to
    AND (
      (v_user.id IS NOT NULL AND d.user_id = v_user.id)
      OR d.employee_record_id = p_employee_id
    );

  IF v_user.id IS NULL AND (v_days IS NULL OR v_days = '[]'::jsonb) THEN
    RETURN jsonb_build_object('linked', false, 'days', '[]'::jsonb);
  END IF;

  IF v_link IS NULL AND v_days <> '[]'::jsonb THEN
    v_link := 'employee_record_id';
  END IF;

  RETURN jsonb_build_object(
    'linked', true,
    'linked_how', v_link,
    'user_id', v_user.id,
    'user_email', COALESCE(v_user.email, v_days->0->>'user_email'),
    'user_full_name', COALESCE(v_user.full_name, v_days->0->>'user_full_name'),
    'days', v_days
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attendance_for_employee(UUID, DATE, DATE) TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_attendance_days'
      AND column_name = 'employee_record_id'
  ) THEN
    UPDATE public.user_attendance_days d
    SET employee_record_id = public.resolve_employee_id_for_uhub_user(d.user_id)
    WHERE d.employee_record_id IS NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

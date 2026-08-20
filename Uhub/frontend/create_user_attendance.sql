-- UHub user attendance (clock in / clock out)
-- Stored against public.users (UHub account holders). Shown on employees
-- only when that user is linked (users.employee_id, employees.auth_user_id, or email).
-- Work dates use Asia/Dubai.

CREATE TABLE IF NOT EXISTS public.user_attendance_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC(6,2),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'complete')),
  source TEXT NOT NULL DEFAULT 'app'
    CHECK (source IN ('app', 'manual', 'biometric')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, work_date)
);

CREATE TABLE IF NOT EXISTS public.user_attendance_punches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.user_attendance_days(id) ON DELETE SET NULL,
  punched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  punch_type TEXT NOT NULL CHECK (punch_type IN ('in', 'out')),
  source TEXT NOT NULL DEFAULT 'app'
    CHECK (source IN ('app', 'manual', 'biometric')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_attendance_days_date
  ON public.user_attendance_days (work_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_attendance_days_user_date
  ON public.user_attendance_days (user_id, work_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_attendance_punches_user_time
  ON public.user_attendance_punches (user_id, punched_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_attendance_punches_day
  ON public.user_attendance_punches (day_id);

COMMENT ON TABLE public.user_attendance_days IS
  'Daily attendance rollup for UHub users (users.id). Display on employee records via user-employee link.';
COMMENT ON TABLE public.user_attendance_punches IS
  'Raw clock-in / clock-out events for UHub users.';

CREATE OR REPLACE FUNCTION public.set_user_attendance_days_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_attendance_days_updated_at ON public.user_attendance_days;
CREATE TRIGGER trg_user_attendance_days_updated_at
  BEFORE UPDATE ON public.user_attendance_days
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_attendance_days_updated_at();

ALTER TABLE public.user_attendance_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_attendance_punches ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_hr_attendance_viewer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'hr_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_employee_attendance_viewer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'hr_manager', 'manager', 'collections', 'subscribe_now')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_uhub_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

DROP POLICY IF EXISTS user_attendance_days_select ON public.user_attendance_days;
CREATE POLICY user_attendance_days_select
  ON public.user_attendance_days
  FOR SELECT
  TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_attendance_viewer()
  );

DROP POLICY IF EXISTS user_attendance_punches_select ON public.user_attendance_punches;
CREATE POLICY user_attendance_punches_select
  ON public.user_attendance_punches
  FOR SELECT
  TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_attendance_viewer()
  );

REVOKE INSERT, UPDATE, DELETE ON public.user_attendance_days FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_attendance_punches FROM anon, authenticated;
GRANT SELECT ON public.user_attendance_days TO authenticated;
GRANT SELECT ON public.user_attendance_punches TO authenticated;

DROP FUNCTION IF EXISTS public.clock_user_attendance(TEXT);
DROP FUNCTION IF EXISTS public.get_my_attendance_today();
DROP FUNCTION IF EXISTS public.get_attendance_overview(DATE, DATE);
DROP FUNCTION IF EXISTS public.get_user_attendance_days(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_attendance_for_employee(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION public.clock_user_attendance(p_punch_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_work_date DATE;
  v_day public.user_attendance_days%ROWTYPE;
  v_punch public.user_attendance_punches%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_punch_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'punch_type must be in or out' USING ERRCODE = '22023';
  END IF;

  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No UHub user account is linked to this login' USING ERRCODE = 'P0001';
  END IF;

  v_work_date := (v_now AT TIME ZONE 'Asia/Dubai')::date;

  SELECT * INTO v_day
  FROM public.user_attendance_days
  WHERE user_id = v_user_id
    AND work_date = v_work_date
  FOR UPDATE;

  IF p_punch_type = 'in' THEN
    IF v_day.id IS NOT NULL AND v_day.clock_in IS NOT NULL AND v_day.clock_out IS NULL THEN
      RAISE EXCEPTION 'Already clocked in' USING ERRCODE = 'P0001';
    END IF;
    IF v_day.id IS NOT NULL AND v_day.clock_out IS NOT NULL THEN
      RAISE EXCEPTION 'Attendance for today is already complete' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.user_attendance_days (user_id, work_date, clock_in, status, source)
    VALUES (v_user_id, v_work_date, v_now, 'open', 'app')
    RETURNING * INTO v_day;
  ELSE
    IF v_day.id IS NULL OR v_day.clock_in IS NULL THEN
      RAISE EXCEPTION 'Clock in first' USING ERRCODE = 'P0001';
    END IF;
    IF v_day.clock_out IS NOT NULL THEN
      RAISE EXCEPTION 'Already clocked out' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.user_attendance_days
    SET
      clock_out = v_now,
      total_hours = ROUND((EXTRACT(EPOCH FROM (v_now - clock_in)) / 3600.0)::numeric, 2),
      status = 'complete'
    WHERE id = v_day.id
    RETURNING * INTO v_day;
  END IF;

  INSERT INTO public.user_attendance_punches (user_id, day_id, punched_at, punch_type, source)
  VALUES (v_user_id, v_day.id, v_now, p_punch_type, 'app')
  RETURNING * INTO v_punch;

  RETURN jsonb_build_object(
    'day', to_jsonb(v_day),
    'punch', to_jsonb(v_punch)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_attendance_today()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_work_date DATE := (NOW() AT TIME ZONE 'Asia/Dubai')::date;
  v_day JSONB;
BEGIN
  v_user_id := public.current_uhub_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('user_id', NULL, 'work_date', v_work_date, 'day', NULL);
  END IF;

  SELECT to_jsonb(d)
  INTO v_day
  FROM public.user_attendance_days d
  WHERE d.user_id = v_user_id
    AND d.work_date = v_work_date;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'work_date', v_work_date,
    'day', v_day
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_overview(p_from DATE, p_to DATE)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  work_date DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC,
  status TEXT,
  source TEXT,
  user_email TEXT,
  user_full_name TEXT,
  employee_record_id TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_hr_attendance_viewer() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.user_id,
    d.work_date,
    d.clock_in,
    d.clock_out,
    d.total_hours,
    d.status,
    d.source,
    u.email,
    COALESCE(u.full_name, split_part(u.email, '@', 1)),
    emp.id::text
  FROM public.user_attendance_days d
  JOIN public.users u ON u.id = d.user_id
  LEFT JOIN LATERAL (
    SELECT e.id
    FROM public.employees e
    WHERE e.id::text = u.employee_id::text
       OR (u.auth_user_id IS NOT NULL AND e.auth_user_id = u.auth_user_id)
       OR (u.email IS NOT NULL AND e.email IS NOT NULL AND lower(e.email) = lower(u.email))
    LIMIT 1
  ) emp ON TRUE
  WHERE d.work_date >= p_from
    AND d.work_date <= p_to
  ORDER BY d.clock_in DESC NULLS LAST, u.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_attendance_days(
  p_user_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS SETOF public.user_attendance_days
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me UUID;
BEGIN
  v_me := public.current_uhub_user_id();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'No UHub user account is linked to this login' USING ERRCODE = 'P0001';
  END IF;

  IF p_user_id <> v_me AND NOT public.is_hr_attendance_viewer() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT d.*
  FROM public.user_attendance_days d
  WHERE d.user_id = p_user_id
    AND d.work_date >= p_from
    AND d.work_date <= p_to
  ORDER BY d.work_date;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_for_employee(
  p_employee_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_emp RECORD;
  v_link TEXT;
  v_days JSONB;
BEGIN
  IF NOT public.is_employee_attendance_viewer() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT e.id, e.auth_user_id, e.email, e.employee_id
  INTO v_emp
  FROM public.employees e
  WHERE e.id = p_employee_id;

  IF v_emp.id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'days', '[]'::jsonb);
  END IF;

  SELECT u.* INTO v_user
  FROM public.users u
  WHERE u.employee_id::text = p_employee_id::text
  LIMIT 1;
  IF FOUND THEN
    v_link := 'users.employee_id';
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

  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'days', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.work_date DESC), '[]'::jsonb)
  INTO v_days
  FROM public.user_attendance_days d
  WHERE d.user_id = v_user.id
    AND d.work_date >= p_from
    AND d.work_date <= p_to;

  RETURN jsonb_build_object(
    'linked', true,
    'linked_how', v_link,
    'user_id', v_user.id,
    'user_email', v_user.email,
    'user_full_name', COALESCE(v_user.full_name, split_part(v_user.email, '@', 1)),
    'days', v_days
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_hr_attendance_viewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employee_attendance_viewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_uhub_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_user_attendance(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_attendance_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_overview(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_attendance_days(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_for_employee(UUID, DATE, DATE) TO authenticated;

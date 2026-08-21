-- Upgrade: location capture, denormalized user labels, write policies, API reload.
-- Run this in the UHub Supabase SQL editor after create_user_attendance.sql.

ALTER TABLE public.user_attendance_days
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS user_full_name TEXT,
  ADD COLUMN IF NOT EXISTS clock_in_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_in_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_in_accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_in_label TEXT,
  ADD COLUMN IF NOT EXISTS clock_out_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS clock_out_label TEXT;

ALTER TABLE public.user_attendance_punches
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_label TEXT;

DROP POLICY IF EXISTS user_attendance_days_insert ON public.user_attendance_days;
CREATE POLICY user_attendance_days_insert
  ON public.user_attendance_days
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_uhub_user_id());

DROP POLICY IF EXISTS user_attendance_days_update ON public.user_attendance_days;
CREATE POLICY user_attendance_days_update
  ON public.user_attendance_days
  FOR UPDATE
  TO authenticated
  USING (user_id = public.current_uhub_user_id())
  WITH CHECK (user_id = public.current_uhub_user_id());

DROP POLICY IF EXISTS user_attendance_punches_insert ON public.user_attendance_punches;
CREATE POLICY user_attendance_punches_insert
  ON public.user_attendance_punches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_uhub_user_id());

DROP POLICY IF EXISTS user_attendance_days_select ON public.user_attendance_days;
CREATE POLICY user_attendance_days_select
  ON public.user_attendance_days
  FOR SELECT
  TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_attendance_viewer()
    OR public.is_employee_attendance_viewer()
  );

DROP POLICY IF EXISTS user_attendance_punches_select ON public.user_attendance_punches;
CREATE POLICY user_attendance_punches_select
  ON public.user_attendance_punches
  FOR SELECT
  TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_attendance_viewer()
    OR public.is_employee_attendance_viewer()
  );

GRANT SELECT, INSERT, UPDATE ON public.user_attendance_days TO authenticated;
GRANT SELECT, INSERT ON public.user_attendance_punches TO authenticated;

DROP FUNCTION IF EXISTS public.clock_user_attendance(TEXT);
DROP FUNCTION IF EXISTS public.clock_user_attendance(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT);
DROP FUNCTION IF EXISTS public.get_attendance_overview(DATE, DATE);

CREATE OR REPLACE FUNCTION public.clock_user_attendance(
  p_punch_type TEXT,
  p_lat DOUBLE PRECISION DEFAULT NULL,
  p_lng DOUBLE PRECISION DEFAULT NULL,
  p_accuracy DOUBLE PRECISION DEFAULT NULL,
  p_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_work_date DATE;
  v_day public.user_attendance_days%ROWTYPE;
  v_punch public.user_attendance_punches%ROWTYPE;
  v_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_punch_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'punch_type must be in or out' USING ERRCODE = '22023';
  END IF;

  SELECT u.* INTO v_user
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'No UHub user account is linked to this login' USING ERRCODE = 'P0001';
  END IF;

  v_name := COALESCE(v_user.full_name, split_part(v_user.email, '@', 1));
  v_work_date := (v_now AT TIME ZONE 'Asia/Dubai')::date;

  SELECT * INTO v_day
  FROM public.user_attendance_days
  WHERE user_id = v_user.id
    AND work_date = v_work_date
  FOR UPDATE;

  IF p_punch_type = 'in' THEN
    IF v_day.id IS NOT NULL AND v_day.clock_in IS NOT NULL AND v_day.clock_out IS NULL THEN
      RAISE EXCEPTION 'Already clocked in' USING ERRCODE = 'P0001';
    END IF;
    IF v_day.id IS NOT NULL AND v_day.clock_out IS NOT NULL THEN
      RAISE EXCEPTION 'Attendance for today is already complete' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.user_attendance_days (
      user_id, work_date, clock_in, status, source,
      user_email, user_full_name,
      clock_in_lat, clock_in_lng, clock_in_accuracy, clock_in_label
    )
    VALUES (
      v_user.id, v_work_date, v_now, 'open', 'app',
      v_user.email, v_name,
      p_lat, p_lng, p_accuracy, p_label
    )
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
      status = 'complete',
      user_email = COALESCE(user_email, v_user.email),
      user_full_name = COALESCE(user_full_name, v_name),
      clock_out_lat = p_lat,
      clock_out_lng = p_lng,
      clock_out_accuracy = p_accuracy,
      clock_out_label = p_label
    WHERE id = v_day.id
    RETURNING * INTO v_day;
  END IF;

  INSERT INTO public.user_attendance_punches (
    user_id, day_id, punched_at, punch_type, source, lat, lng, accuracy, location_label
  )
  VALUES (
    v_user.id, v_day.id, v_now, p_punch_type, 'app', p_lat, p_lng, p_accuracy, p_label
  )
  RETURNING * INTO v_punch;

  RETURN jsonb_build_object(
    'day', to_jsonb(v_day),
    'punch', to_jsonb(v_punch)
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
  employee_record_id TEXT,
  clock_in_label TEXT,
  clock_out_label TEXT,
  clock_in_lat DOUBLE PRECISION,
  clock_in_lng DOUBLE PRECISION,
  clock_out_lat DOUBLE PRECISION,
  clock_out_lng DOUBLE PRECISION
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
    COALESCE(d.user_email, u.email),
    COALESCE(d.user_full_name, u.full_name, split_part(COALESCE(u.email, d.user_email), '@', 1)),
    emp.id::text,
    d.clock_in_label,
    d.clock_out_label,
    d.clock_in_lat,
    d.clock_in_lng,
    d.clock_out_lat,
    d.clock_out_lng
  FROM public.user_attendance_days d
  LEFT JOIN public.users u ON u.id = d.user_id
  LEFT JOIN LATERAL (
    SELECT e.id
    FROM public.employees e
    WHERE e.id::text = u.employee_id::text
       OR (u.email IS NOT NULL AND e.email IS NOT NULL AND lower(e.email) = lower(u.email))
       OR (d.user_email IS NOT NULL AND e.email IS NOT NULL AND lower(e.email) = lower(d.user_email))
    LIMIT 1
  ) emp ON TRUE
  WHERE d.work_date >= p_from
    AND d.work_date <= p_to
  ORDER BY d.clock_in DESC NULLS LAST, COALESCE(d.user_email, u.email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.clock_user_attendance(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_overview(DATE, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';

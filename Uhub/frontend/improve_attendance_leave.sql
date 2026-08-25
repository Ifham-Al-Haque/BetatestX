-- Attendance + leave operational fixes.
-- Run in the UHub Supabase SQL editor after create_user_attendance.sql,
-- upgrade_user_attendance_location.sql, create_attendance_regularization.sql,
-- create_leave_system.sql, and fix_employee_profile_attendance.sql.

-- 1) Link UHub users → UDrive employees by staff code as well as UUID / auth / email.
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
    SELECT e.id INTO v_emp_id
    FROM public.employees e
    WHERE e.id::text = v_user.employee_id::text
    LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;

    SELECT e.id INTO v_emp_id
    FROM public.employees e
    WHERE e.employee_id IS NOT NULL
      AND e.employee_id::text = v_user.employee_id::text
    LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;
  END IF;

  IF v_user.auth_user_id IS NOT NULL THEN
    SELECT e.id INTO v_emp_id FROM public.employees e WHERE e.auth_user_id = v_user.auth_user_id LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;
  END IF;

  IF v_user.email IS NOT NULL AND btrim(v_user.email) <> '' THEN
    SELECT e.id INTO v_emp_id
    FROM public.employees e
    WHERE e.email IS NOT NULL AND lower(e.email) = lower(v_user.email)
    LIMIT 1;
    IF v_emp_id IS NOT NULL THEN RETURN v_emp_id; END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_hr_leave_approver()
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
      AND u.role IN ('hr_manager', 'admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_hr_attendance_approver()
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
      AND u.role IN ('hr_manager', 'admin', 'super_admin')
  );
$$;

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
      AND u.role IN ('admin', 'super_admin', 'hr_manager')
  );
$$;

-- 2) Complementary half-days / short leave can share a date; full-day leave still blocks.
CREATE OR REPLACE FUNCTION public.leave_coverage_kind(p_type TEXT, p_session TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_type = 'short' THEN 'short'
    WHEN p_type = 'half_day' OR p_session IN ('morning', 'afternoon') THEN 'half'
    ELSE 'full'
  END;
$$;

CREATE OR REPLACE FUNCTION public.leave_blocks_clock(p_type TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_type, '') NOT IN ('wfh', 'short', 'half_day');
$$;

CREATE OR REPLACE FUNCTION public.leave_date_ranges_overlap(
  p_type TEXT,
  p_from DATE,
  p_to DATE,
  p_session TEXT,
  p_start_time TIME,
  p_end_time TIME,
  p_other public.leave_requests
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_new TEXT;
  v_old TEXT;
BEGIN
  IF p_other.start_date > p_to OR p_other.end_date < p_from THEN
    RETURN FALSE;
  END IF;

  v_new := public.leave_coverage_kind(p_type, p_session);
  v_old := public.leave_coverage_kind(p_other.leave_type, p_other.session);

  IF v_new = 'full' OR v_old = 'full' THEN
    RETURN TRUE;
  END IF;

  IF v_new = 'half' AND v_old = 'half' THEN
    RETURN COALESCE(p_session, 'morning') = COALESCE(p_other.session, 'morning');
  END IF;

  IF v_new = 'short' AND v_old = 'short' THEN
    IF p_start_time IS NULL OR p_end_time IS NULL OR p_other.start_time IS NULL OR p_other.end_time IS NULL THEN
      RETURN TRUE;
    END IF;
    RETURN p_start_time < p_other.end_time AND p_end_time > p_other.start_time;
  END IF;

  -- half + short on the same date is allowed (they still work part of the day)
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_leave_request(
  p_leave_type TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_reason TEXT,
  p_session TEXT DEFAULT 'full',
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_emp UUID;
  v_type public.leave_types%ROWTYPE;
  v_units NUMERIC;
  v_year INT;
  v_balance_code TEXT;
  v_bal public.leave_balances%ROWTYPE;
  v_remaining NUMERIC;
  v_row public.leave_requests%ROWTYPE;
  v_existing public.leave_requests%ROWTYPE;
BEGIN
  v_user := public.current_uhub_user_id();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Please provide a reason' USING ERRCODE = '22023';
  END IF;
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'End date cannot be before start date' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_type FROM public.leave_types WHERE code = p_leave_type AND is_active;
  IF v_type.code IS NULL THEN
    RAISE EXCEPTION 'Unknown leave type' USING ERRCODE = '22023';
  END IF;

  v_units := public.count_leave_units(p_leave_type, p_start_date, p_end_date, COALESCE(p_session, 'full'), p_start_time, p_end_time);
  v_year := EXTRACT(YEAR FROM p_start_date)::INT;
  v_emp := public.resolve_employee_id_for_uhub_user(v_user);
  v_balance_code := public.leave_balance_code(p_leave_type);

  FOR v_existing IN
    SELECT *
    FROM public.leave_requests r
    WHERE r.user_id = v_user
      AND r.status IN ('pending', 'approved')
      AND r.start_date <= p_end_date
      AND r.end_date >= p_start_date
  LOOP
    IF public.leave_date_ranges_overlap(
      p_leave_type, p_start_date, p_end_date, COALESCE(p_session, 'full'), p_start_time, p_end_time, v_existing
    ) THEN
      RAISE EXCEPTION 'You already have leave on these dates' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  PERFORM public.ensure_leave_balances(v_user, v_year);

  IF NOT v_type.is_unlimited THEN
    SELECT * INTO v_bal
    FROM public.leave_balances
    WHERE user_id = v_user AND year = v_year AND leave_type = v_balance_code
    FOR UPDATE;
    IF v_bal.id IS NULL THEN
      RAISE EXCEPTION 'Leave balance not found' USING ERRCODE = 'P0001';
    END IF;
    v_remaining := v_bal.entitled - v_bal.taken - v_bal.pending;
    IF v_units > v_remaining THEN
      RAISE EXCEPTION 'Not enough % leave remaining', v_type.label USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.leave_balances
    SET pending = pending + v_units, updated_at = NOW()
    WHERE id = v_bal.id;
  END IF;

  INSERT INTO public.leave_requests (
    user_id, employee_id, leave_type, start_date, end_date, session,
    start_time, end_time, units, unit, reason, status, assigned_role
  )
  VALUES (
    v_user, v_emp, p_leave_type, p_start_date, p_end_date, COALESCE(p_session, 'full'),
    p_start_time, p_end_time, v_units, v_type.unit, btrim(p_reason), 'pending', 'hr_manager'
  )
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

-- 3) Tight leave privacy: own rows + HR. Managers use get_leave_for_employee.
DROP POLICY IF EXISTS leave_balances_select ON public.leave_balances;
CREATE POLICY leave_balances_select ON public.leave_balances
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_leave_approver()
  );

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
CREATE POLICY leave_requests_select ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_leave_approver()
  );

CREATE OR REPLACE FUNCTION public.get_leave_for_employee(p_employee_id UUID, p_year INT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INT := COALESCE(p_year, EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Dubai'))::INT);
  v_me public.users%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_emp RECORD;
  v_is_self BOOLEAN := FALSE;
  v_resolved UUID;
  v_balances JSONB;
  v_requests JSONB;
BEGIN
  SELECT e.id, e.auth_user_id, e.email, e.employee_id
  INTO v_emp
  FROM public.employees e
  WHERE e.id = p_employee_id;

  IF v_emp.id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'balances', '[]'::jsonb, 'requests', '[]'::jsonb, 'year', v_year);
  END IF;

  SELECT u.* INTO v_me FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1;
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
    END IF;
  END IF;

  IF NOT public.is_hr_leave_approver()
     AND NOT public.is_employee_attendance_viewer()
     AND NOT v_is_self THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  IF v_user.id IS NULL THEN
    SELECT u.* INTO v_user FROM public.users u WHERE u.employee_id::text = p_employee_id::text LIMIT 1;
  END IF;
  IF v_user.id IS NULL AND v_emp.auth_user_id IS NOT NULL THEN
    SELECT u.* INTO v_user FROM public.users u WHERE u.auth_user_id = v_emp.auth_user_id LIMIT 1;
  END IF;
  IF v_user.id IS NULL AND v_emp.email IS NOT NULL AND btrim(v_emp.email) <> '' THEN
    SELECT u.* INTO v_user FROM public.users u WHERE lower(u.email) = lower(v_emp.email) LIMIT 1;
  END IF;
  IF v_user.id IS NULL AND v_emp.employee_id IS NOT NULL THEN
    SELECT u.* INTO v_user FROM public.users u WHERE u.employee_id::text = v_emp.employee_id::text LIMIT 1;
  END IF;

  IF v_user.id IS NOT NULL AND (v_is_self OR public.is_hr_leave_approver()) THEN
    PERFORM public.ensure_leave_balances(v_user.id, v_year);
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.leave_type), '[]'::jsonb)
  INTO v_balances
  FROM public.leave_balances b
  WHERE b.year = v_year
    AND (
      (v_user.id IS NOT NULL AND b.user_id = v_user.id)
      OR b.employee_id = p_employee_id
    );

  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.start_date DESC, r.created_at DESC), '[]'::jsonb)
  INTO v_requests
  FROM public.leave_requests r
  WHERE (
      (v_user.id IS NOT NULL AND r.user_id = v_user.id)
      OR r.employee_id = p_employee_id
    );

  RETURN jsonb_build_object(
    'linked', (v_user.id IS NOT NULL OR v_balances <> '[]'::jsonb OR v_requests <> '[]'::jsonb),
    'user_id', v_user.id,
    'balances', v_balances,
    'requests', v_requests,
    'year', v_year
  );
END;
$$;

-- 4) Clock vs leave + forgotten clock-out (never invent a clock-out time).
CREATE OR REPLACE FUNCTION public.blocking_leave_for_user(p_user_id UUID, p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows JSONB;
  v_me UUID;
BEGIN
  v_me := public.current_uhub_user_id();
  IF v_me IS NULL OR (p_user_id IS DISTINCT FROM v_me AND NOT public.is_hr_leave_approver() AND NOT public.is_hr_attendance_viewer()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  IF to_regclass('public.leave_requests') IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'leave_type', r.leave_type,
    'session', r.session,
    'start_time', r.start_time,
    'end_time', r.end_time,
    'units', r.units,
    'unit', r.unit,
    'blocks_clock', public.leave_blocks_clock(r.leave_type)
  ) ORDER BY r.start_date), '[]'::jsonb)
  INTO v_rows
  FROM public.leave_requests r
  WHERE r.user_id = p_user_id
    AND r.status = 'approved'
    AND r.start_date <= p_date
    AND r.end_date >= p_date;

  RETURN COALESCE(v_rows, '[]'::jsonb);
END;
$$;

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
  v_leave JSONB;
  v_block JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_punch_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'punch_type must be in or out' USING ERRCODE = '22023';
  END IF;

  SELECT u.* INTO v_user FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1;
  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'No UHub user account is linked to this login' USING ERRCODE = 'P0001';
  END IF;

  v_name := COALESCE(v_user.full_name, split_part(v_user.email, '@', 1));
  v_work_date := (v_now AT TIME ZONE 'Asia/Dubai')::date;
  v_leave := public.blocking_leave_for_user(v_user.id, v_work_date);

  IF p_punch_type = 'in' THEN
    SELECT value INTO v_block
    FROM jsonb_array_elements(v_leave) AS value
    WHERE (value->>'blocks_clock')::boolean
    LIMIT 1;
    IF v_block IS NOT NULL THEN
      RAISE EXCEPTION 'You are on approved % leave today. Clock-in is blocked — regularize with HR if this is a mistake.',
        v_block->>'leave_type'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  SELECT * INTO v_day
  FROM public.user_attendance_days
  WHERE user_id = v_user.id AND work_date = v_work_date
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
    'punch', to_jsonb(v_punch),
    'on_leave', v_leave
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_missed_work_dates(p_lookback INT DEFAULT 14)
RETURNS TABLE (d DATE)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := public.current_uhub_user_id();
  v_today DATE := (NOW() AT TIME ZONE 'Asia/Dubai')::date;
  v_from DATE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  IF p_lookback IS NULL OR p_lookback < 1 THEN
    p_lookback := 14;
  END IF;
  IF p_lookback > 60 THEN
    p_lookback := 60;
  END IF;
  v_from := v_today - p_lookback;

  RETURN QUERY
  SELECT gs::date
  FROM generate_series(v_from, v_today - 1, INTERVAL '1 day') AS gs
  WHERE EXTRACT(ISODOW FROM gs) NOT IN (6, 7)
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_attendance_days a
      WHERE a.user_id = v_user_id
        AND a.work_date = gs::date
        AND a.clock_in IS NOT NULL
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.leave_requests r
      WHERE r.user_id = v_user_id
        AND r.status = 'approved'
        AND r.start_date <= gs::date
        AND r.end_date >= gs::date
        AND public.leave_blocks_clock(r.leave_type)
    )
  ORDER BY gs DESC;
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
  v_stale JSONB;
  v_leave JSONB;
  v_missed JSONB;
BEGIN
  v_user_id := public.current_uhub_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'user_id', NULL,
      'work_date', v_work_date,
      'day', NULL,
      'stale_open', '[]'::jsonb,
      'on_leave', '[]'::jsonb,
      'missed_days', '[]'::jsonb
    );
  END IF;

  SELECT to_jsonb(d) INTO v_day
  FROM public.user_attendance_days d
  WHERE d.user_id = v_user_id AND d.work_date = v_work_date;

  SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.work_date DESC), '[]'::jsonb)
  INTO v_stale
  FROM public.user_attendance_days d
  WHERE d.user_id = v_user_id
    AND d.clock_in IS NOT NULL
    AND d.clock_out IS NULL
    AND d.work_date < v_work_date;

  v_leave := public.blocking_leave_for_user(v_user_id, v_work_date);

  SELECT COALESCE(jsonb_agg(jsonb_build_object('work_date', m.d) ORDER BY m.d DESC), '[]'::jsonb)
  INTO v_missed
  FROM public.get_my_missed_work_dates(14) m;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'work_date', v_work_date,
    'day', v_day,
    'stale_open', COALESCE(v_stale, '[]'::jsonb),
    'on_leave', COALESCE(v_leave, '[]'::jsonb),
    'missed_days', COALESCE(v_missed, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_stale_open_attendance()
RETURNS SETOF public.user_attendance_days
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'Asia/Dubai')::date;
BEGIN
  IF NOT public.is_hr_attendance_viewer() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT d.*
  FROM public.user_attendance_days d
  WHERE d.clock_in IS NOT NULL
    AND d.clock_out IS NULL
    AND d.work_date < v_today
  ORDER BY d.work_date DESC, d.clock_in DESC;
END;
$$;

-- 5) Regularization writes punch history; punches may be source=regularized.
ALTER TABLE public.user_attendance_punches
  DROP CONSTRAINT IF EXISTS user_attendance_punches_source_check;
ALTER TABLE public.user_attendance_punches
  ADD CONSTRAINT user_attendance_punches_source_check
  CHECK (source IN ('app', 'manual', 'biometric', 'regularized'));

CREATE OR REPLACE FUNCTION public.review_attendance_regularization(
  p_id UUID,
  p_decision TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.attendance_regularization_requests%ROWTYPE;
  v_reviewer UUID;
  v_in TIMESTAMPTZ;
  v_out TIMESTAMPTZ;
  v_hours NUMERIC;
  v_day_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_hr_attendance_approver() THEN
    RAISE EXCEPTION 'Only HR can approve or reject regularization' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'decision must be approved or rejected' USING ERRCODE = '22023';
  END IF;

  SELECT u.id INTO v_reviewer FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1;
  SELECT * INTO v_req FROM public.attendance_regularization_requests WHERE id = p_id FOR UPDATE;

  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0001';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending' USING ERRCODE = 'P0001';
  END IF;

  IF p_decision = 'approved' THEN
    IF v_req.requested_clock_in IS NOT NULL THEN
      v_in := ((v_req.work_date::text || ' ' || v_req.requested_clock_in::text)::timestamp AT TIME ZONE 'Asia/Dubai');
    END IF;
    IF v_req.requested_clock_out IS NOT NULL THEN
      v_out := ((v_req.work_date::text || ' ' || v_req.requested_clock_out::text)::timestamp AT TIME ZONE 'Asia/Dubai');
    END IF;
    IF v_in IS NOT NULL AND v_out IS NOT NULL AND v_out < v_in THEN
      v_out := v_out + INTERVAL '1 day';
    END IF;
    IF v_in IS NOT NULL AND v_out IS NOT NULL THEN
      v_hours := ROUND((EXTRACT(EPOCH FROM (v_out - v_in)) / 3600.0)::numeric, 2);
    END IF;

    INSERT INTO public.user_attendance_days (
      user_id, work_date, clock_in, clock_out, total_hours, status, source,
      user_email, user_full_name, employee_record_id
    )
    VALUES (
      v_req.user_id,
      v_req.work_date,
      v_in,
      v_out,
      v_hours,
      CASE WHEN v_out IS NOT NULL THEN 'complete' ELSE 'open' END,
      'regularized',
      v_req.requester_email,
      v_req.requester_name,
      COALESCE(v_req.employee_record_id, public.resolve_employee_id_for_uhub_user(v_req.user_id))
    )
    ON CONFLICT (user_id, work_date) DO UPDATE
    SET
      clock_in = COALESCE(EXCLUDED.clock_in, public.user_attendance_days.clock_in),
      clock_out = COALESCE(EXCLUDED.clock_out, public.user_attendance_days.clock_out),
      total_hours = CASE
        WHEN EXCLUDED.clock_in IS NOT NULL AND EXCLUDED.clock_out IS NOT NULL THEN EXCLUDED.total_hours
        ELSE public.user_attendance_days.total_hours
      END,
      status = CASE
        WHEN COALESCE(EXCLUDED.clock_out, public.user_attendance_days.clock_out) IS NOT NULL THEN 'complete'
        ELSE 'open'
      END,
      source = 'regularized',
      employee_record_id = COALESCE(public.user_attendance_days.employee_record_id, EXCLUDED.employee_record_id),
      updated_at = NOW()
    RETURNING id INTO v_day_id;

    IF v_in IS NOT NULL THEN
      INSERT INTO public.user_attendance_punches (user_id, day_id, punched_at, punch_type, source)
      VALUES (v_req.user_id, v_day_id, v_in, 'in', 'regularized');
    END IF;
    IF v_out IS NOT NULL THEN
      INSERT INTO public.user_attendance_punches (user_id, day_id, punched_at, punch_type, source)
      VALUES (v_req.user_id, v_day_id, v_out, 'out', 'regularized');
    END IF;
  END IF;

  UPDATE public.attendance_regularization_requests
  SET
    status = p_decision,
    reviewed_by = v_reviewer,
    reviewed_at = NOW(),
    review_notes = p_notes,
    day_id = COALESCE(v_day_id, day_id),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_req;

  RETURN to_jsonb(v_req);
END;
$$;

UPDATE public.user_attendance_days d
SET employee_record_id = public.resolve_employee_id_for_uhub_user(d.user_id)
WHERE d.employee_record_id IS NULL;

UPDATE public.leave_requests r
SET employee_id = public.resolve_employee_id_for_uhub_user(r.user_id)
WHERE r.employee_id IS NULL;

UPDATE public.leave_balances b
SET employee_id = public.resolve_employee_id_for_uhub_user(b.user_id)
WHERE b.employee_id IS NULL;

GRANT EXECUTE ON FUNCTION public.leave_coverage_kind(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_blocks_clock(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_leave_request(TEXT, DATE, DATE, TEXT, TEXT, TIME, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leave_for_employee(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_user_attendance(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_attendance_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_missed_work_dates(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stale_open_attendance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_attendance_regularization(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_employee_id_for_uhub_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_leave_approver() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_attendance_approver() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_attendance_viewer() TO authenticated;

NOTIFY pgrst, 'reload schema';

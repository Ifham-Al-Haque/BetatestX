-- Employee-profile link + attendance regularization (HR approval).
-- Run in the UHub Supabase SQL editor after create_user_attendance.sql
-- and upgrade_user_attendance_location.sql.

ALTER TABLE public.user_attendance_days
  ADD COLUMN IF NOT EXISTS employee_record_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_attendance_days_employee
  ON public.user_attendance_days (employee_record_id);

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
    IF v_emp_id IS NOT NULL THEN
      RETURN v_emp_id;
    END IF;
  END IF;

  IF v_user.auth_user_id IS NOT NULL THEN
    SELECT e.id INTO v_emp_id
    FROM public.employees e
    WHERE e.auth_user_id = v_user.auth_user_id
    LIMIT 1;
    IF v_emp_id IS NOT NULL THEN
      RETURN v_emp_id;
    END IF;
  END IF;

  IF v_user.email IS NOT NULL AND btrim(v_user.email) <> '' THEN
    SELECT e.id INTO v_emp_id
    FROM public.employees e
    WHERE e.email IS NOT NULL AND lower(e.email) = lower(v_user.email)
    LIMIT 1;
    IF v_emp_id IS NOT NULL THEN
      RETURN v_emp_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

UPDATE public.user_attendance_days d
SET employee_record_id = public.resolve_employee_id_for_uhub_user(d.user_id)
WHERE d.employee_record_id IS NULL;

CREATE OR REPLACE FUNCTION public.stamp_attendance_employee_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.employee_record_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.employee_record_id := public.resolve_employee_id_for_uhub_user(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_attendance_employee ON public.user_attendance_days;
CREATE TRIGGER trg_stamp_attendance_employee
  BEFORE INSERT OR UPDATE OF user_id, employee_record_id ON public.user_attendance_days
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_attendance_employee_id();

CREATE OR REPLACE FUNCTION public.stamp_regularization_requester()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.requester_auth_id IS NULL OR NEW.requester_email IS NULL THEN
    SELECT u.auth_user_id, u.email, COALESCE(u.full_name, split_part(u.email, '@', 1)),
           COALESCE(NEW.employee_record_id, public.resolve_employee_id_for_uhub_user(u.id))
    INTO NEW.requester_auth_id, NEW.requester_email, NEW.requester_name, NEW.employee_record_id
    FROM public.users u
    WHERE u.id = NEW.user_id
    LIMIT 1;
  ELSIF NEW.employee_record_id IS NULL THEN
    NEW.employee_record_id := public.resolve_employee_id_for_uhub_user(NEW.user_id);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
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
      AND u.role IN ('hr_manager', 'admin')
  );
$$;

CREATE TABLE IF NOT EXISTS public.attendance_regularization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  day_id UUID REFERENCES public.user_attendance_days(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL DEFAULT 'wrong_time'
    CHECK (request_type IN ('missed_clock_in', 'missed_clock_out', 'wrong_time', 'forgot_punch', 'other')),
  requested_clock_in TIME,
  requested_clock_out TIME,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  assigned_role TEXT NOT NULL DEFAULT 'hr_manager',
  requester_email TEXT,
  requester_name TEXT,
  requester_auth_id UUID,
  employee_record_id UUID,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_pending_user_date
  ON public.attendance_regularization_requests (user_id, work_date)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reg_status ON public.attendance_regularization_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reg_user ON public.attendance_regularization_requests (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_stamp_regularization_requester ON public.attendance_regularization_requests;
CREATE TRIGGER trg_stamp_regularization_requester
  BEFORE INSERT OR UPDATE OF user_id ON public.attendance_regularization_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_regularization_requester();

ALTER TABLE public.attendance_regularization_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_reg_select ON public.attendance_regularization_requests;
CREATE POLICY attendance_reg_select
  ON public.attendance_regularization_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_attendance_approver()
  );

DROP POLICY IF EXISTS attendance_reg_insert ON public.attendance_regularization_requests;
CREATE POLICY attendance_reg_insert
  ON public.attendance_regularization_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_uhub_user_id());

DROP POLICY IF EXISTS attendance_reg_update ON public.attendance_regularization_requests;
CREATE POLICY attendance_reg_update
  ON public.attendance_regularization_requests
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = public.current_uhub_user_id() AND status = 'pending')
    OR public.is_hr_attendance_approver()
  )
  WITH CHECK (
    (user_id = public.current_uhub_user_id() AND status IN ('pending', 'cancelled'))
    OR public.is_hr_attendance_approver()
  );

GRANT SELECT, INSERT, UPDATE ON public.attendance_regularization_requests TO authenticated;

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

  SELECT u.id INTO v_reviewer
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;

  SELECT * INTO v_req
  FROM public.attendance_regularization_requests
  WHERE id = p_id
  FOR UPDATE;

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

ALTER TABLE public.user_attendance_days
  DROP CONSTRAINT IF EXISTS user_attendance_days_source_check;
ALTER TABLE public.user_attendance_days
  ADD CONSTRAINT user_attendance_days_source_check
  CHECK (source IN ('app', 'manual', 'biometric', 'regularized'));

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

GRANT EXECUTE ON FUNCTION public.resolve_employee_id_for_uhub_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_attendance_approver() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_attendance_regularization(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_for_employee(UUID, DATE, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';

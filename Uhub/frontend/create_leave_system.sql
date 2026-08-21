-- Employee leave (annual, sick, casual, festive, WFH, short, half-day, unpaid).
-- Run after create_user_attendance.sql (needs current_uhub_user_id).
-- Work dates use Asia/Dubai. Weekend is Saturday–Sunday.

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

CREATE TABLE IF NOT EXISTS public.leave_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('days', 'hours')),
  default_quota NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_unlimited BOOLEAN NOT NULL DEFAULT FALSE,
  deducts_from TEXT,
  requires_reason BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.leave_types (code, label, unit, default_quota, is_unlimited, deducts_from, sort_order) VALUES
  ('annual', 'Annual Leave', 'days', 30, FALSE, NULL, 10),
  ('sick', 'Sick Leave', 'days', 15, FALSE, NULL, 20),
  ('casual', 'Casual Leave', 'days', 7, FALSE, NULL, 30),
  ('festive', 'Festive Leave', 'days', 5, FALSE, NULL, 40),
  ('wfh', 'Work From Home', 'days', 24, FALSE, NULL, 50),
  ('short', 'Short Leave', 'hours', 24, FALSE, NULL, 60),
  ('half_day', 'Half Day', 'days', 0, FALSE, 'annual', 70),
  ('unpaid', 'Unpaid Leave', 'days', 0, TRUE, NULL, 80)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  unit = EXCLUDED.unit,
  default_quota = EXCLUDED.default_quota,
  is_unlimited = EXCLUDED.is_unlimited,
  deducts_from = EXCLUDED.deducts_from,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  year INT NOT NULL,
  leave_type TEXT NOT NULL REFERENCES public.leave_types(code),
  entitled NUMERIC(8,2) NOT NULL DEFAULT 0,
  taken NUMERIC(8,2) NOT NULL DEFAULT 0,
  pending NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, leave_type)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee
  ON public.leave_balances (employee_id, year);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  leave_type TEXT NOT NULL REFERENCES public.leave_types(code),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  session TEXT NOT NULL DEFAULT 'full'
    CHECK (session IN ('full', 'morning', 'afternoon')),
  start_time TIME,
  end_time TIME,
  units NUMERIC(8,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'days' CHECK (unit IN ('days', 'hours')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  assigned_role TEXT NOT NULL DEFAULT 'hr_manager',
  requester_email TEXT,
  requester_name TEXT,
  requester_auth_id UUID,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_requests_date_ok CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON public.leave_requests (user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests (employee_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests (start_date, end_date);

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
      AND u.role IN ('hr_manager', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.count_leave_units(
  p_type TEXT,
  p_from DATE,
  p_to DATE,
  p_session TEXT,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  d DATE;
  n NUMERIC := 0;
  v_type public.leave_types%ROWTYPE;
BEGIN
  SELECT * INTO v_type FROM public.leave_types WHERE code = p_type;
  IF v_type.code IS NULL THEN
    RAISE EXCEPTION 'Unknown leave type' USING ERRCODE = '22023';
  END IF;

  IF v_type.unit = 'hours' THEN
    IF p_start_time IS NULL OR p_end_time IS NULL THEN
      RAISE EXCEPTION 'Short leave needs a start and end time' USING ERRCODE = '22023';
    END IF;
    IF p_end_time <= p_start_time THEN
      RAISE EXCEPTION 'End time must be after start time' USING ERRCODE = '22023';
    END IF;
    RETURN ROUND((EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600.0)::numeric, 2);
  END IF;

  IF p_type = 'half_day' OR p_session IN ('morning', 'afternoon') THEN
    RETURN 0.5;
  END IF;

  d := p_from;
  WHILE d <= p_to LOOP
    IF EXTRACT(ISODOW FROM d) NOT IN (6, 7) THEN
      n := n + 1;
    END IF;
    d := d + 1;
  END LOOP;

  IF n <= 0 THEN
    RAISE EXCEPTION 'Selected dates fall on the weekend' USING ERRCODE = '22023';
  END IF;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_leave_balances(p_user_id UUID, p_year INT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INT := COALESCE(p_year, EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Dubai'))::INT);
  v_emp UUID;
  v_me UUID;
BEGIN
  v_me := public.current_uhub_user_id();
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_me AND NOT public.is_hr_leave_approver() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  v_emp := public.resolve_employee_id_for_uhub_user(p_user_id);
  INSERT INTO public.leave_balances (user_id, employee_id, year, leave_type, entitled)
  SELECT p_user_id, v_emp, v_year, t.code, t.default_quota
  FROM public.leave_types t
  WHERE t.is_active
    AND t.deducts_from IS NULL
  ON CONFLICT (user_id, year, leave_type) DO UPDATE
    SET employee_id = COALESCE(public.leave_balances.employee_id, EXCLUDED.employee_id),
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_balance_code(p_type TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(deducts_from, code) FROM public.leave_types WHERE code = p_type;
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
  v_overlap INT;
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

  SELECT COUNT(*) INTO v_overlap
  FROM public.leave_requests r
  WHERE r.user_id = v_user
    AND r.status IN ('pending', 'approved')
    AND r.start_date <= p_end_date
    AND r.end_date >= p_start_date;
  IF v_overlap > 0 THEN
    RAISE EXCEPTION 'You already have leave on these dates' USING ERRCODE = 'P0001';
  END IF;

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

CREATE OR REPLACE FUNCTION public.review_leave_request(
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
  v_req public.leave_requests%ROWTYPE;
  v_reviewer UUID;
  v_year INT;
  v_balance_code TEXT;
  v_unlimited BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_hr_leave_approver() THEN
    RAISE EXCEPTION 'Only HR can approve or reject leave' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'decision must be approved or rejected' USING ERRCODE = '22023';
  END IF;

  SELECT u.id INTO v_reviewer FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1;

  SELECT * INTO v_req FROM public.leave_requests WHERE id = p_id FOR UPDATE;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0001';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending' USING ERRCODE = 'P0001';
  END IF;

  SELECT t.is_unlimited, public.leave_balance_code(v_req.leave_type)
  INTO v_unlimited, v_balance_code
  FROM public.leave_types t
  WHERE t.code = v_req.leave_type;

  v_year := EXTRACT(YEAR FROM v_req.start_date)::INT;

  IF NOT COALESCE(v_unlimited, FALSE) THEN
    IF p_decision = 'approved' THEN
      UPDATE public.leave_balances
      SET pending = GREATEST(pending - v_req.units, 0),
          taken = taken + v_req.units,
          updated_at = NOW()
      WHERE user_id = v_req.user_id AND year = v_year AND leave_type = v_balance_code;
    ELSE
      UPDATE public.leave_balances
      SET pending = GREATEST(pending - v_req.units, 0),
          updated_at = NOW()
      WHERE user_id = v_req.user_id AND year = v_year AND leave_type = v_balance_code;
    END IF;
  END IF;

  UPDATE public.leave_requests
  SET status = p_decision,
      reviewed_by = v_reviewer,
      reviewed_at = NOW(),
      review_notes = p_notes,
      updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_req;

  RETURN to_jsonb(v_req);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_leave_request(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.leave_requests%ROWTYPE;
  v_user UUID;
  v_year INT;
  v_balance_code TEXT;
  v_unlimited BOOLEAN;
BEGIN
  v_user := public.current_uhub_user_id();
  SELECT * INTO v_req FROM public.leave_requests WHERE id = p_id FOR UPDATE;
  IF v_req.id IS NULL OR v_req.user_id <> v_user THEN
    RAISE EXCEPTION 'Request not found' USING ERRCODE = 'P0001';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be cancelled' USING ERRCODE = 'P0001';
  END IF;

  SELECT t.is_unlimited, public.leave_balance_code(v_req.leave_type)
  INTO v_unlimited, v_balance_code
  FROM public.leave_types t
  WHERE t.code = v_req.leave_type;

  v_year := EXTRACT(YEAR FROM v_req.start_date)::INT;
  IF NOT COALESCE(v_unlimited, FALSE) THEN
    UPDATE public.leave_balances
    SET pending = GREATEST(pending - v_req.units, 0), updated_at = NOW()
    WHERE user_id = v_req.user_id AND year = v_year AND leave_type = v_balance_code;
  END IF;

  UPDATE public.leave_requests
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_id
  RETURNING * INTO v_req;

  RETURN to_jsonb(v_req);
END;
$$;

CREATE OR REPLACE FUNCTION public.stamp_leave_request_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.employee_id IS NULL THEN
    NEW.employee_id := public.resolve_employee_id_for_uhub_user(NEW.user_id);
  END IF;
  IF NEW.requester_auth_id IS NULL OR NEW.requester_email IS NULL THEN
    SELECT u.auth_user_id, u.email, COALESCE(u.full_name, split_part(u.email, '@', 1))
    INTO NEW.requester_auth_id, NEW.requester_email, NEW.requester_name
    FROM public.users u
    WHERE u.id = NEW.user_id
    LIMIT 1;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_leave_request_profile ON public.leave_requests;
CREATE TRIGGER trg_stamp_leave_request_profile
  BEFORE INSERT OR UPDATE OF user_id, employee_id ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_leave_request_profile();

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leave_types_select ON public.leave_types;
CREATE POLICY leave_types_select ON public.leave_types
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS leave_balances_select ON public.leave_balances;
CREATE POLICY leave_balances_select ON public.leave_balances
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_leave_approver()
    OR public.is_employee_attendance_viewer()
  );

DROP POLICY IF EXISTS leave_requests_select ON public.leave_requests;
CREATE POLICY leave_requests_select ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    user_id = public.current_uhub_user_id()
    OR public.is_hr_leave_approver()
    OR public.is_employee_attendance_viewer()
  );

DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
CREATE POLICY leave_requests_insert ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_uhub_user_id());

DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
CREATE POLICY leave_requests_update ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (
    (user_id = public.current_uhub_user_id() AND status = 'pending')
    OR public.is_hr_leave_approver()
  );

GRANT SELECT ON public.leave_types TO authenticated;
GRANT SELECT ON public.leave_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leave_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_hr_leave_approver() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_leave_units(TEXT, DATE, DATE, TEXT, TIME, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_leave_balances(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_leave_request(TEXT, DATE, DATE, TEXT, TEXT, TIME, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_leave_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_leave_request(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

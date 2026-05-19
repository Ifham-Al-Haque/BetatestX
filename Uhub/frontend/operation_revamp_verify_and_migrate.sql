-- =============================================================================
-- UHub Operation Revamp — Verify, Sync & Roster Migration
-- =============================================================================
-- Run in Supabase SQL Editor on your UHub project.
--
-- HOW TO RUN:
--   1. Run PART A only first (verification) — read results, no changes.
--   2. Run PART B if verification shows gaps (safe idempotent fixes).
--   3. Run PART C when ready to sync onboarding vehicles → Fleet Record.
--   4. Run PART D when building Schedule & Roster UI (optional until then).
--
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / ON CONFLICT where possible.
-- =============================================================================

-- =============================================================================
-- PART A — VERIFICATION (read-only)
-- =============================================================================

-- A1) Core Operation / Fleet tables present?
SELECT
  t.table_name,
  CASE
    WHEN t.table_type = 'VIEW' THEN 'view'
    ELSE 'table'
  END AS kind,
  'expected' AS status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'fleet_vehicles', 'fleet_vehicles_enhanced',
    'fleet_onboarding_checklists', 'fleet_onboarding_history', 'fleet_onboarding_overview',
    'fleet_offboarding_records', 'fleet_offboarding_checklist_items',
    'fleet_maintenance', 'fleet_maintenance_tickets', 'fleet_maintenance_ticket_stats',
    'fleet_fuel_logs', 'fleet_incidents', 'fleet_drivers',
    'fleet_pm_templates', 'fleet_pm_schedules', 'fleet_overview',
    'fleet_delivery_checklists', 'fleet_delivery_history',
    'drivers', 'driver_documents'
  )
ORDER BY t.table_name;

-- A2) Future roster tables (missing until PART D)
SELECT
  expected.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables i
    WHERE i.table_schema = 'public' AND i.table_name = expected.table_name
  ) AS exists
FROM (
  VALUES
    ('operation_teams'),
    ('operation_team_members'),
    ('operation_shifts'),
    ('operation_roster_entries')
) AS expected(table_name);

-- A3) Driver columns used by Operation Team Records filters
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'drivers'
  AND column_name IN (
    'team_type', 'team_name', 'team_members',
    'shift_type', 'location', 'status'
  )
ORDER BY column_name;

-- A4) Fleet statistics RPC (Fleet Dashboard)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_fleet_statistics';

-- A5) Vehicle overlap: onboarding (enhanced) vs Fleet Record (fleet_vehicles)
SELECT
  (SELECT COUNT(*)::int FROM fleet_vehicles) AS fleet_vehicles_count,
  (SELECT COUNT(*)::int FROM fleet_vehicles_enhanced) AS enhanced_count,
  (SELECT COUNT(*)::int
   FROM fleet_vehicles_enhanced e
   WHERE EXISTS (SELECT 1 FROM fleet_vehicles v WHERE v.id = e.id)) AS same_id_in_both,
  (SELECT COUNT(*)::int
   FROM fleet_vehicles_enhanced e
   WHERE NOT EXISTS (SELECT 1 FROM fleet_vehicles v WHERE v.id = e.id)) AS enhanced_only_not_in_fleet_vehicles,
  (SELECT COUNT(*)::int
   FROM fleet_vehicles v
   WHERE NOT EXISTS (SELECT 1 FROM fleet_vehicles_enhanced e WHERE e.id = v.id)) AS fleet_vehicles_only;

-- A6) Offboarding columns expected by fleetOffboardingService.js
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fleet_offboarding_records'
  AND column_name IN (
    'id', 'vehicle_id', 'reason', 'offboarding_date', 'status',
    'progress_percentage', 'notes', 'started_by', 'started_at', 'completed_at'
  )
ORDER BY column_name;

-- A7) Breakdown-ready incidents (no new table required)
SELECT incident_type, COUNT(*)::int AS cnt
FROM fleet_incidents
GROUP BY incident_type
ORDER BY cnt DESC;


-- =============================================================================
-- PART B — OPTIONAL FIXES (idempotent)
-- =============================================================================

-- B1) Driver location + filter indexes (Team Records)
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS location VARCHAR(100);

COMMENT ON COLUMN public.drivers.location IS 'Driver location/emirate (Dubai, Abu Dhabi, etc.)';

CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(location);
CREATE INDEX IF NOT EXISTS idx_drivers_team_type ON public.drivers(team_type);
CREATE INDEX IF NOT EXISTS idx_drivers_designation ON public.drivers(designation);

-- B2) Extend fleet_vehicles.status to include Onboarding (matches enhanced table)
ALTER TABLE public.fleet_vehicles
  DROP CONSTRAINT IF EXISTS fleet_vehicles_status_check;

ALTER TABLE public.fleet_vehicles
  ADD CONSTRAINT fleet_vehicles_status_check
  CHECK (status IN (
    'Onboarding', 'Active', 'Maintenance', 'Out of Service', 'Retired'
  ));

-- B3) Offboarding columns used by the app (if your table predates the service)
ALTER TABLE public.fleet_offboarding_records
  ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES public.employees(id),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- B4) get_fleet_statistics() for Fleet Dashboard (skip if A4 already shows it)
CREATE OR REPLACE FUNCTION public.get_fleet_statistics()
RETURNS TABLE (
  total_vehicles INTEGER,
  active_vehicles INTEGER,
  maintenance_vehicles INTEGER,
  out_of_service_vehicles INTEGER,
  total_mileage BIGINT,
  avg_fuel_efficiency DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'Active')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'Maintenance')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'Out of Service')::INTEGER,
    COALESCE(SUM(mileage), 0)::BIGINT,
    COALESCE(AVG(fuel_efficiency), 0)::DECIMAL(5,2)
  FROM public.fleet_vehicles;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_fleet_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fleet_statistics() TO service_role;


-- =============================================================================
-- PART C — SYNC fleet_vehicles_enhanced → fleet_vehicles (Fleet Record source)
-- =============================================================================
-- Keeps the same UUID so maintenance, offboarding, and Fleet Record stay linked.
-- Onboarding flow writes to enhanced; Fleet Record reads fleet_vehicles.

CREATE OR REPLACE FUNCTION public.map_enhanced_status_to_fleet(p_status TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_status
    WHEN 'Onboarding' THEN 'Onboarding'
    WHEN 'Active' THEN 'Active'
    WHEN 'Maintenance' THEN 'Maintenance'
    WHEN 'Out of Service' THEN 'Out of Service'
    WHEN 'Retired' THEN 'Retired'
    ELSE 'Active'
  END;
$$;

CREATE OR REPLACE FUNCTION public.sync_fleet_vehicle_from_enhanced()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_vin TEXT;
  v_target_id UUID;
BEGIN
  v_status := public.map_enhanced_status_to_fleet(NEW.status);
  v_vin := NULLIF(TRIM(COALESCE(NEW.vin_number, NEW.chassis_number, '')), '');

  -- When onboarding completes, promote to Active in Fleet Record unless retired/OOS
  IF NEW.onboarding_status = 'Completed' AND v_status = 'Onboarding' THEN
    v_status := 'Active';
  END IF;

  -- Same physical vehicle may already exist in fleet_vehicles under another id (e.g. sample ABC-123)
  SELECT v.id INTO v_target_id
  FROM public.fleet_vehicles v
  WHERE v.id = NEW.id
     OR v.license_plate = NEW.license_plate
     OR v.vehicle_number = NEW.vehicle_number
  ORDER BY (v.id = NEW.id) DESC, v.created_at ASC NULLS LAST
  LIMIT 1;

  IF v_target_id IS NOT NULL AND v_target_id <> NEW.id THEN
    UPDATE public.fleet_vehicles
    SET
      make = NEW.make,
      model = NEW.model,
      year = NEW.model_year,
      vin = v_vin,
      color = NEW.color,
      fuel_type = NEW.fuel_type,
      transmission = NEW.transmission,
      engine_size = NEW.engine_size,
      mileage = COALESCE(NEW.mileage, 0),
      status = v_status,
      department_id = NEW.department_id,
      assigned_driver_id = NEW.assigned_driver_id,
      purchase_date = NEW.purchase_date,
      purchase_price = NEW.purchase_price,
      insurance_expiry = NEW.insurance_expiry,
      registration_expiry = NEW.registration_expiry,
      last_service_date = NEW.last_service_date,
      next_service_date = NEW.next_service_date,
      fuel_efficiency = NEW.fuel_efficiency,
      notes = NEW.notes,
      updated_at = COALESCE(NEW.updated_at, NOW()),
      updated_by = NEW.updated_by
    WHERE id = v_target_id;
    RETURN NEW;
  END IF;

  INSERT INTO public.fleet_vehicles (
    id,
    vehicle_number,
    make,
    model,
    year,
    license_plate,
    vin,
    color,
    fuel_type,
    transmission,
    engine_size,
    mileage,
    status,
    department_id,
    assigned_driver_id,
    purchase_date,
    purchase_price,
    insurance_expiry,
    registration_expiry,
    last_service_date,
    next_service_date,
    fuel_efficiency,
    notes,
    created_at,
    updated_at,
    created_by,
    updated_by
  )
  VALUES (
    NEW.id,
    NEW.vehicle_number,
    NEW.make,
    NEW.model,
    NEW.model_year,
    NEW.license_plate,
    v_vin,
    NEW.color,
    NEW.fuel_type,
    NEW.transmission,
    NEW.engine_size,
    COALESCE(NEW.mileage, 0),
    v_status,
    NEW.department_id,
    NEW.assigned_driver_id,
    NEW.purchase_date,
    NEW.purchase_price,
    NEW.insurance_expiry,
    NEW.registration_expiry,
    NEW.last_service_date,
    NEW.next_service_date,
    NEW.fuel_efficiency,
    NEW.notes,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW()),
    NEW.created_by,
    NEW.updated_by
  )
  ON CONFLICT (id) DO UPDATE SET
    vehicle_number = EXCLUDED.vehicle_number,
    make = EXCLUDED.make,
    model = EXCLUDED.model,
    year = EXCLUDED.year,
    license_plate = EXCLUDED.license_plate,
    vin = EXCLUDED.vin,
    color = EXCLUDED.color,
    fuel_type = EXCLUDED.fuel_type,
    transmission = EXCLUDED.transmission,
    engine_size = EXCLUDED.engine_size,
    mileage = EXCLUDED.mileage,
    status = EXCLUDED.status,
    department_id = EXCLUDED.department_id,
    assigned_driver_id = EXCLUDED.assigned_driver_id,
    purchase_date = EXCLUDED.purchase_date,
    purchase_price = EXCLUDED.purchase_price,
    insurance_expiry = EXCLUDED.insurance_expiry,
    registration_expiry = EXCLUDED.registration_expiry,
    last_service_date = EXCLUDED.last_service_date,
    next_service_date = EXCLUDED.next_service_date,
    fuel_efficiency = EXCLUDED.fuel_efficiency,
    notes = EXCLUDED.notes,
    updated_at = COALESCE(EXCLUDED.updated_at, NOW()),
    updated_by = EXCLUDED.updated_by;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_fleet_vehicle_from_enhanced ON public.fleet_vehicles_enhanced;

CREATE TRIGGER trg_sync_fleet_vehicle_from_enhanced
  AFTER INSERT OR UPDATE ON public.fleet_vehicles_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_fleet_vehicle_from_enhanced();

-- C-pre) Rows that share plate/number but different id (fix before backfill if INSERT failed)
-- See operation_revamp_part_c_fix_duplicates.sql

-- One-time backfill: insert only when id, license_plate, and vehicle_number are all free
INSERT INTO public.fleet_vehicles (
  id, vehicle_number, make, model, year, license_plate, vin,
  color, fuel_type, transmission, engine_size, mileage, status,
  department_id, assigned_driver_id,
  purchase_date, purchase_price, insurance_expiry, registration_expiry,
  last_service_date, next_service_date, fuel_efficiency, notes,
  created_at, updated_at, created_by, updated_by
)
SELECT
  e.id,
  e.vehicle_number,
  e.make,
  e.model,
  e.model_year,
  e.license_plate,
  NULLIF(TRIM(COALESCE(e.vin_number, e.chassis_number, '')), ''),
  e.color,
  e.fuel_type,
  e.transmission,
  e.engine_size,
  COALESCE(e.mileage, 0),
  public.map_enhanced_status_to_fleet(
    CASE WHEN e.onboarding_status = 'Completed' AND e.status = 'Onboarding' THEN 'Active' ELSE e.status END
  ),
  e.department_id,
  e.assigned_driver_id,
  e.purchase_date,
  e.purchase_price,
  e.insurance_expiry,
  e.registration_expiry,
  e.last_service_date,
  e.next_service_date,
  e.fuel_efficiency,
  e.notes,
  COALESCE(e.created_at, NOW()),
  COALESCE(e.updated_at, NOW()),
  e.created_by,
  e.updated_by
FROM public.fleet_vehicles_enhanced e
WHERE NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.id = e.id)
  AND NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.license_plate = e.license_plate)
  AND NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.vehicle_number = e.vehicle_number)
ON CONFLICT (id) DO NOTHING;

-- Merge enhanced into existing fleet row when plate matches but id differs
UPDATE public.fleet_vehicles v
SET
  make = e.make,
  model = e.model,
  year = e.model_year,
  vin = NULLIF(TRIM(COALESCE(e.vin_number, e.chassis_number, '')), ''),
  color = e.color,
  fuel_type = e.fuel_type,
  transmission = e.transmission,
  engine_size = e.engine_size,
  mileage = COALESCE(e.mileage, 0),
  status = public.map_enhanced_status_to_fleet(
    CASE WHEN e.onboarding_status = 'Completed' AND e.status = 'Onboarding' THEN 'Active' ELSE e.status END
  ),
  department_id = e.department_id,
  assigned_driver_id = e.assigned_driver_id,
  purchase_date = e.purchase_date,
  purchase_price = e.purchase_price,
  insurance_expiry = e.insurance_expiry,
  registration_expiry = e.registration_expiry,
  last_service_date = e.last_service_date,
  next_service_date = e.next_service_date,
  fuel_efficiency = e.fuel_efficiency,
  notes = e.notes,
  updated_at = COALESCE(e.updated_at, NOW()),
  updated_by = e.updated_by
FROM public.fleet_vehicles_enhanced e
WHERE v.license_plate = e.license_plate
  AND v.id <> e.id;

-- Re-run sync for rows that exist in both but may be stale (updates by id)
UPDATE public.fleet_vehicles v
SET
  vehicle_number = e.vehicle_number,
  make = e.make,
  model = e.model,
  year = e.model_year,
  license_plate = e.license_plate,
  vin = NULLIF(TRIM(COALESCE(e.vin_number, e.chassis_number, '')), ''),
  color = e.color,
  fuel_type = e.fuel_type,
  transmission = e.transmission,
  engine_size = e.engine_size,
  mileage = COALESCE(e.mileage, 0),
  status = public.map_enhanced_status_to_fleet(
    CASE WHEN e.onboarding_status = 'Completed' AND e.status = 'Onboarding' THEN 'Active' ELSE e.status END
  ),
  department_id = e.department_id,
  assigned_driver_id = e.assigned_driver_id,
  purchase_date = e.purchase_date,
  purchase_price = e.purchase_price,
  insurance_expiry = e.insurance_expiry,
  registration_expiry = e.registration_expiry,
  last_service_date = e.last_service_date,
  next_service_date = e.next_service_date,
  fuel_efficiency = e.fuel_efficiency,
  notes = e.notes,
  updated_at = COALESCE(e.updated_at, NOW()),
  updated_by = e.updated_by
FROM public.fleet_vehicles_enhanced e
WHERE v.id = e.id;


-- =============================================================================
-- PART D — OPERATION TEAM SCHEDULE & ROSTER (Phase 4 — run when building UI)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.operation_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  team_type VARCHAR(50),
  lead_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.operation_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.operation_teams(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at DATE DEFAULT CURRENT_DATE,
  left_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, driver_id)
);

CREATE TABLE IF NOT EXISTS public.operation_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.operation_teams(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  shift_type VARCHAR(20) NOT NULL DEFAULT 'Day'
    CHECK (shift_type IN ('Day', 'Night', 'Split', 'Off')),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.operation_roster_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.operation_shifts(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.fleet_vehicles(id) ON DELETE SET NULL,
  route_or_zone VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operation_team_members_team ON public.operation_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_operation_team_members_driver ON public.operation_team_members(driver_id);
CREATE INDEX IF NOT EXISTS idx_operation_shifts_date ON public.operation_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_operation_shifts_driver ON public.operation_shifts(driver_id);
CREATE INDEX IF NOT EXISTS idx_operation_roster_shift ON public.operation_roster_entries(shift_id);
CREATE INDEX IF NOT EXISTS idx_operation_roster_vehicle ON public.operation_roster_entries(vehicle_id);

COMMENT ON TABLE public.operation_teams IS 'Operation department teams (links to drivers, not employees HR records)';
COMMENT ON TABLE public.operation_shifts IS 'Per-driver shift plan for Schedule & Roster';
COMMENT ON TABLE public.operation_roster_entries IS 'Optional vehicle/route assignment per shift';

-- RLS (align with other fleet tables — authenticated full access; tighten later by role)
ALTER TABLE public.operation_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_roster_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operation_teams_authenticated ON public.operation_teams;
CREATE POLICY operation_teams_authenticated ON public.operation_teams
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS operation_team_members_authenticated ON public.operation_team_members;
CREATE POLICY operation_team_members_authenticated ON public.operation_team_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS operation_shifts_authenticated ON public.operation_shifts;
CREATE POLICY operation_shifts_authenticated ON public.operation_shifts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS operation_roster_entries_authenticated ON public.operation_roster_entries;
CREATE POLICY operation_roster_entries_authenticated ON public.operation_roster_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_roster_entries TO authenticated;


-- =============================================================================
-- PART E — POST-RUN VERIFICATION
-- =============================================================================

SELECT 'Post-sync vehicle counts' AS check_name, *
FROM (
  SELECT
    (SELECT COUNT(*)::int FROM fleet_vehicles) AS fleet_vehicles_count,
    (SELECT COUNT(*)::int FROM fleet_vehicles_enhanced) AS enhanced_count,
    (SELECT COUNT(*)::int
     FROM fleet_vehicles_enhanced e
     WHERE EXISTS (SELECT 1 FROM fleet_vehicles v WHERE v.id = e.id)) AS same_id_in_both
) x;

SELECT 'Roster tables' AS check_name, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'operation_%'
ORDER BY table_name;

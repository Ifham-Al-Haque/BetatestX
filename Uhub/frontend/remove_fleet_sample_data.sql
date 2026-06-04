-- =============================================================================
-- Remove fleet SAMPLE / TEST data  (run in Supabase SQL Editor)
-- =============================================================================
-- Matches the same rows the app hides as "sample":
--   * vehicle_number starting with FLEET- or FL-
--   * license_plate in the known seed plates
-- (see src/services/fleetVehicleMediaService.js -> SAMPLE_FLEET_PATTERNS)
--
-- HOW TO USE:
--   1) Run "STEP 1" first to preview exactly what will be deleted.
--   2) If it looks right, run "STEP 2" (the transaction) to delete.
--   3) Run "STEP 3" to confirm counts.
--
-- STEP 2 is ACTIVE (not commented). It is wrapped in BEGIN/COMMIT and only
-- touches tables that exist, so it is safe to run as-is.
-- =============================================================================


-- =============================================================================
-- STEP 1 — PREVIEW (read-only)
-- =============================================================================
SELECT 'fleet_vehicles' AS source, id, vehicle_number, license_plate, make, model, status
FROM public.fleet_vehicles
WHERE vehicle_number ~* '^(FLEET-|FL-)'
   OR license_plate IN ('ABC-123','XYZ-456','XYZ-789','DEF-456','GHI-789','JKL-012')
ORDER BY vehicle_number;

SELECT 'fleet_vehicles_enhanced' AS source, id, vehicle_number, license_plate, make, model, onboarding_status
FROM public.fleet_vehicles_enhanced
WHERE vehicle_number ~* '^(FLEET-|FL-)'
   OR license_plate IN ('ABC-123','XYZ-456','XYZ-789','DEF-456','GHI-789','JKL-012')
ORDER BY vehicle_number;


-- =============================================================================
-- STEP 2 — DELETE (transactional, only touches tables that exist)
-- =============================================================================
BEGIN;

-- Collect the sample ids once
CREATE TEMP TABLE _sample_fleet_ids ON COMMIT DROP AS
SELECT id FROM public.fleet_vehicles
WHERE vehicle_number ~* '^(FLEET-|FL-)'
   OR license_plate IN ('ABC-123','XYZ-456','XYZ-789','DEF-456','GHI-789','JKL-012');

CREATE TEMP TABLE _sample_enh_ids ON COMMIT DROP AS
SELECT id FROM public.fleet_vehicles_enhanced
WHERE vehicle_number ~* '^(FLEET-|FL-)'
   OR license_plate IN ('ABC-123','XYZ-456','XYZ-789','DEF-456','GHI-789','JKL-012');

DO $$
DECLARE
  -- child tables that reference fleet_vehicles(id) via vehicle_id
  v_child TEXT;
  v_children TEXT[] := ARRAY[
    'fleet_maintenance',
    'fleet_maintenance_tickets',
    'fleet_fuel_logs',
    'fleet_incidents',
    'fleet_pm_schedules',
    'fleet_vehicle_documents'
  ];
BEGIN
  -- Offboarding checklist items (depend on offboarding records of sample vehicles)
  IF to_regclass('public.fleet_offboarding_checklist_items') IS NOT NULL
     AND to_regclass('public.fleet_offboarding_records') IS NOT NULL THEN
    DELETE FROM public.fleet_offboarding_checklist_items
    WHERE offboarding_record_id IN (
      SELECT r.id FROM public.fleet_offboarding_records r
      WHERE r.vehicle_id IN (SELECT id FROM _sample_fleet_ids)
    );
  END IF;

  IF to_regclass('public.fleet_offboarding_records') IS NOT NULL THEN
    DELETE FROM public.fleet_offboarding_records
    WHERE vehicle_id IN (SELECT id FROM _sample_fleet_ids);
  END IF;

  -- Generic vehicle_id children
  FOREACH v_child IN ARRAY v_children LOOP
    IF to_regclass('public.' || v_child) IS NOT NULL THEN
      EXECUTE format(
        'DELETE FROM public.%I WHERE vehicle_id IN (SELECT id FROM _sample_fleet_ids)',
        v_child
      );
    END IF;
  END LOOP;

  -- Enhanced onboarding children
  IF to_regclass('public.fleet_onboarding_history') IS NOT NULL THEN
    DELETE FROM public.fleet_onboarding_history
    WHERE vehicle_id IN (SELECT id FROM _sample_enh_ids);
  END IF;

  IF to_regclass('public.fleet_onboarding_checklists') IS NOT NULL THEN
    DELETE FROM public.fleet_onboarding_checklists
    WHERE vehicle_id IN (SELECT id FROM _sample_enh_ids);
  END IF;
END $$;

-- Enhanced vehicles
DELETE FROM public.fleet_vehicles_enhanced
WHERE id IN (SELECT id FROM _sample_enh_ids);

-- Finally the Fleet Record vehicles
DELETE FROM public.fleet_vehicles
WHERE id IN (SELECT id FROM _sample_fleet_ids);

COMMIT;


-- =============================================================================
-- STEP 3 — VERIFY (read-only)
-- =============================================================================
SELECT
  (SELECT COUNT(*)::int FROM public.fleet_vehicles)          AS fleet_vehicles_remaining,
  (SELECT COUNT(*)::int FROM public.fleet_vehicles_enhanced) AS enhanced_remaining,
  (SELECT COUNT(*)::int FROM public.fleet_vehicles
     WHERE vehicle_number ~* '^(FLEET-|FL-)'
        OR license_plate IN ('ABC-123','XYZ-456','XYZ-789','DEF-456','GHI-789','JKL-012')) AS sample_left;

-- =============================================================================
-- Remove fleet sample / test data (run in Supabase SQL Editor)
-- =============================================================================
-- STEP 1: Preview rows that will be removed (run this first)
-- =============================================================================

SELECT 'fleet_vehicles' AS source, id, vehicle_number, license_plate, make, model, status
FROM public.fleet_vehicles
WHERE vehicle_number ~ '^(FLEET-|FL-)' 
   OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
ORDER BY vehicle_number;

SELECT 'fleet_vehicles_enhanced' AS source, id, vehicle_number, license_plate, make, model, onboarding_status
FROM public.fleet_vehicles_enhanced
WHERE vehicle_number ~ '^(FLEET-|FL-)' 
   OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
ORDER BY vehicle_number;

-- =============================================================================
-- STEP 2: Delete sample data (only after preview looks correct)
-- Uncomment the block below and run once.
-- =============================================================================

/*
BEGIN;

-- Enhanced onboarding (children first)
DELETE FROM public.fleet_onboarding_history
WHERE vehicle_id IN (
  SELECT id FROM public.fleet_vehicles_enhanced
  WHERE vehicle_number ~ '^(FLEET-|FL-)'
     OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
);

DELETE FROM public.fleet_onboarding_checklists
WHERE vehicle_id IN (
  SELECT id FROM public.fleet_vehicles_enhanced
  WHERE vehicle_number ~ '^(FLEET-|FL-)'
     OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
);

DELETE FROM public.fleet_vehicles_enhanced
WHERE vehicle_number ~ '^(FLEET-|FL-)'
   OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012');

-- Fleet Record + related (cascade may handle some FKs)
DELETE FROM public.fleet_offboarding_checklist_items
WHERE offboarding_record_id IN (
  SELECT r.id FROM public.fleet_offboarding_records r
  JOIN public.fleet_vehicles v ON v.id = r.vehicle_id
  WHERE v.vehicle_number ~ '^(FLEET-|FL-)'
     OR v.license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
);

DELETE FROM public.fleet_offboarding_records
WHERE vehicle_id IN (
  SELECT id FROM public.fleet_vehicles
  WHERE vehicle_number ~ '^(FLEET-|FL-)'
     OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
);

-- Optional: if fleet_vehicle_documents exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fleet_vehicle_documents') THEN
    DELETE FROM public.fleet_vehicle_documents
    WHERE vehicle_id IN (
      SELECT id FROM public.fleet_vehicles
      WHERE vehicle_number ~ '^(FLEET-|FL-)'
         OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012')
    );
  END IF;
END $$;

DELETE FROM public.fleet_vehicles
WHERE vehicle_number ~ '^(FLEET-|FL-)'
   OR license_plate IN ('ABC-123', 'XYZ-456', 'XYZ-789', 'DEF-456', 'GHI-789', 'JKL-012');

COMMIT;
*/

-- STEP 3: Verify counts after delete
-- SELECT COUNT(*) FROM fleet_vehicles;
-- SELECT COUNT(*) FROM fleet_vehicles_enhanced;

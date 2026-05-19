-- =============================================================================
-- PART C fix — license_plate / vehicle_number conflicts (e.g. ABC-123)
-- Run in Supabase SQL Editor AFTER the PART C error.
-- =============================================================================

-- 1) See conflicts (different id, same plate or vehicle_number)
SELECT
  'license_plate' AS conflict_on,
  e.id AS enhanced_id,
  e.vehicle_number AS enhanced_vehicle_number,
  e.license_plate,
  e.make,
  e.model,
  v.id AS fleet_vehicles_id,
  v.vehicle_number AS fleet_vehicle_number
FROM public.fleet_vehicles_enhanced e
JOIN public.fleet_vehicles v
  ON v.license_plate = e.license_plate AND v.id <> e.id

UNION ALL

SELECT
  'vehicle_number',
  e.id,
  e.vehicle_number,
  e.license_plate,
  e.make,
  e.model,
  v.id,
  v.vehicle_number
FROM public.fleet_vehicles_enhanced e
JOIN public.fleet_vehicles v
  ON v.vehicle_number = e.vehicle_number AND v.id <> e.id;


-- 2) OPTIONAL: Remove known sample onboarding rows (from enhanced_fleet_onboarding_schema.sql)
--    Only run if step 1 shows FL-001 / FL-002 / ABC-123 as test data you do not need.
/*
DELETE FROM public.fleet_onboarding_history
WHERE vehicle_id IN (
  SELECT id FROM public.fleet_vehicles_enhanced
  WHERE vehicle_number IN ('FL-001', 'FL-002') OR license_plate IN ('ABC-123', 'XYZ-456')
);

DELETE FROM public.fleet_onboarding_checklists
WHERE vehicle_id IN (
  SELECT id FROM public.fleet_vehicles_enhanced
  WHERE vehicle_number IN ('FL-001', 'FL-002') OR license_plate IN ('ABC-123', 'XYZ-456')
);

DELETE FROM public.fleet_vehicles_enhanced
WHERE vehicle_number IN ('FL-001', 'FL-002') OR license_plate IN ('ABC-123', 'XYZ-456');
*/


-- 3) Merge enhanced → existing fleet_vehicles row when plate/number matches (same real vehicle)
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

-- 4) Same-id sync (rows already aligned by UUID)
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

-- 5) Safe backfill — only insert when id AND plate AND vehicle_number are all free
INSERT INTO public.fleet_vehicles (
  id, vehicle_number, make, model, year, license_plate, vin,
  color, fuel_type, transmission, engine_size, mileage, status,
  department_id, assigned_driver_id,
  purchase_date, purchase_price, insurance_expiry, registration_expiry,
  last_service_date, next_service_date, fuel_efficiency, notes,
  created_at, updated_at, created_by, updated_by
)
SELECT
  e.id, e.vehicle_number, e.make, e.model, e.model_year, e.license_plate,
  NULLIF(TRIM(COALESCE(e.vin_number, e.chassis_number, '')), ''),
  e.color, e.fuel_type, e.transmission, e.engine_size, COALESCE(e.mileage, 0),
  public.map_enhanced_status_to_fleet(
    CASE WHEN e.onboarding_status = 'Completed' AND e.status = 'Onboarding' THEN 'Active' ELSE e.status END
  ),
  e.department_id, e.assigned_driver_id,
  e.purchase_date, e.purchase_price, e.insurance_expiry, e.registration_expiry,
  e.last_service_date, e.next_service_date, e.fuel_efficiency, e.notes,
  COALESCE(e.created_at, NOW()), COALESCE(e.updated_at, NOW()), e.created_by, e.updated_by
FROM public.fleet_vehicles_enhanced e
WHERE NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.id = e.id)
  AND NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.license_plate = e.license_plate)
  AND NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.vehicle_number = e.vehicle_number)
ON CONFLICT (id) DO NOTHING;

-- 6) Remaining conflicts (manual review)
SELECT
  e.id AS enhanced_id,
  e.vehicle_number,
  e.license_plate,
  'still not linked — delete sample or reassign plate' AS action
FROM public.fleet_vehicles_enhanced e
WHERE NOT EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.id = e.id)
  AND (
    EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.license_plate = e.license_plate)
    OR EXISTS (SELECT 1 FROM public.fleet_vehicles v WHERE v.vehicle_number = e.vehicle_number)
  );

-- Fleet Record profile fields (Phase 1)
-- Run in Supabase SQL Editor on fleet_vehicles

ALTER TABLE public.fleet_vehicles
  ADD COLUMN IF NOT EXISTS car_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS body_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS powertrain_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS seat_count INTEGER,
  ADD COLUMN IF NOT EXISTS fuel_tank_capacity_liters DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS business_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS iot_device_id VARCHAR(50);

COMMENT ON COLUMN public.fleet_vehicles.car_name IS 'Display name for fleet record (e.g. Mini Cooper Fleet 12)';
COMMENT ON COLUMN public.fleet_vehicles.body_type IS 'SUV, Sedan, Hatchback, Van, etc.';
COMMENT ON COLUMN public.fleet_vehicles.powertrain_type IS 'Normal, Hybrid, EV';
COMMENT ON COLUMN public.fleet_vehicles.business_type IS 'PPM, Daily, Monthly, Limo';

-- Optional: backfill IoT from enhanced table where ids match
UPDATE public.fleet_vehicles v
SET iot_device_id = e.iot_device_imei
FROM public.fleet_vehicles_enhanced e
WHERE v.id = e.id
  AND v.iot_device_id IS NULL
  AND e.iot_device_imei IS NOT NULL;

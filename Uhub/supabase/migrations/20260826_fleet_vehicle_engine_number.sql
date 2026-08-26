-- Engine number on fleet vehicles (Mulkiya identification)
ALTER TABLE public.fleet_vehicles
  ADD COLUMN IF NOT EXISTS engine_number VARCHAR(80);

COMMENT ON COLUMN public.fleet_vehicles.engine_number IS 'Engine number as printed on the Mulkiya / registration card';

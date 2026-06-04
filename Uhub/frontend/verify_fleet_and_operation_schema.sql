-- =============================================================================
-- Verify Fleet Record + Operation revamp schema (run in Supabase SQL Editor)
-- Copy results and compare to the checklist in comments below.
-- =============================================================================

-- ---------- 1) Fleet profile columns (add_fleet_vehicle_profile_fields.sql) ----------
SELECT 'fleet_vehicles profile columns' AS check_group,
       column_name,
       data_type,
       'OK' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fleet_vehicles'
  AND column_name IN (
    'car_name', 'body_type', 'powertrain_type', 'seat_count',
    'fuel_tank_capacity_liters', 'business_type', 'iot_device_id'
  )
ORDER BY column_name;

-- Expected: 7 rows. If fewer, run add_fleet_vehicle_profile_fields.sql

-- ---------- 2) Fleet media (create_fleet_vehicle_media_schema.sql) ----------
SELECT 'fleet_vehicles.fleet_image_url' AS check_group,
       column_name,
       data_type,
       'OK' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fleet_vehicles'
  AND column_name = 'fleet_image_url';

SELECT 'fleet_vehicle_documents table' AS check_group,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'fleet_vehicle_documents'
       ) AS table_exists;

SELECT 'fleet_vehicle_documents RLS' AS check_group,
       relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'fleet_vehicle_documents';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'fleet_vehicle_documents';

-- Expected: table_exists = true, rls_enabled = true, policy fleet_vehicle_documents_authenticated

-- ---------- 3) Storage bucket (Dashboard — FLEET_ASSETS_STORAGE_SETUP.md) ----------
SELECT 'storage bucket fleet-assets' AS check_group,
       id, name, public
FROM storage.buckets
WHERE id = 'fleet-assets';

SELECT 'storage policies fleet-assets' AS check_group,
       policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'fleet_assets%'
ORDER BY policyname;

-- Expected: 1 bucket row (public = true), 4 policies (insert/select/update/delete)

-- ---------- 4) Operation roster (operation_revamp PART D) ----------
SELECT expected.table_name,
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

-- ---------- 5) Offboarding columns (operation_revamp PART B) ----------
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fleet_offboarding_records'
  AND column_name IN ('started_by', 'started_at', 'completed_at')
ORDER BY column_name;

-- Expected: 3 rows

-- ---------- 6) Data counts ----------
SELECT
  (SELECT COUNT(*)::int FROM fleet_vehicles) AS fleet_vehicles,
  (SELECT COUNT(*)::int FROM fleet_vehicles_enhanced) AS enhanced,
  (SELECT COUNT(*)::int FROM fleet_vehicle_documents) AS documents,
  (SELECT COUNT(*)::int FROM fleet_vehicles WHERE fleet_image_url IS NOT NULL) AS with_photo;

-- =====================================================
-- COMPLETE FIX: Remove All Existing Policies and Create Fresh Ones
-- This will ensure no conflicts
-- =====================================================
-- WARNING: This drops ALL existing policies for driver buckets
-- Run this only if you're sure, or check existing policies first

-- =====================================================
-- Step 1: Check current policies
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  qual as using_expr,
  with_check as with_check_expr
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%driver%'
    OR qual::text LIKE '%driver-profiles%'
    OR qual::text LIKE '%driver-documents%'
    OR with_check::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-documents%'
  );

-- =====================================================
-- Step 2: Drop ALL existing driver-related policies
-- =====================================================
-- Uncomment these lines to remove all existing policies:
/*
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname LIKE '%driver%'
        OR qual::text LIKE '%driver-profiles%'
        OR qual::text LIKE '%driver-documents%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;
*/

-- =====================================================
-- Step 3: Create SIMPLE policies that will work
-- =====================================================

-- IMPORTANT: These policies use a simpler check that should work
-- They allow ALL operations for authenticated users on these buckets

-- For driver-profiles - INSERT
CREATE POLICY IF NOT EXISTS "driver-profiles-insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-profiles');

-- For driver-profiles - SELECT
CREATE POLICY IF NOT EXISTS "driver-profiles-select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-profiles');

-- For driver-profiles - UPDATE
CREATE POLICY IF NOT EXISTS "driver-profiles-update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- For driver-profiles - DELETE
CREATE POLICY IF NOT EXISTS "driver-profiles-delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-profiles');

-- For driver-documents - INSERT
CREATE POLICY IF NOT EXISTS "driver-documents-insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents');

-- For driver-documents - SELECT
CREATE POLICY IF NOT EXISTS "driver-documents-select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-documents');

-- For driver-documents - UPDATE
CREATE POLICY IF NOT EXISTS "driver-documents-update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- For driver-documents - DELETE
CREATE POLICY IF NOT EXISTS "driver-documents-delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents');

-- =====================================================
-- Step 4: Verify all policies were created
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  CASE WHEN 'authenticated' = ANY(roles) THEN '✓' ELSE '✗' END as has_authenticated
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'driver-%'
ORDER BY policyname, cmd;


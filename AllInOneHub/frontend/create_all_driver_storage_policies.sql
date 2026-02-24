-- =====================================================
-- COMPLETE FIX: Create ALL Required Policies for Driver Storage
-- This creates policies for both driver-profiles and driver-documents
-- =====================================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- If you get "must be owner" error, use Dashboard UI instead

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Drop existing policies to avoid conflicts
-- =====================================================
DROP POLICY IF EXISTS "driver-profiles-insert" ON storage.objects;
DROP POLICY IF EXISTS "driver-profiles-select" ON storage.objects;
DROP POLICY IF EXISTS "driver-profiles-update" ON storage.objects;
DROP POLICY IF EXISTS "driver-profiles-delete" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-insert" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-select" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-update" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-delete" ON storage.objects;

-- Also drop any other driver-related policies
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
  END LOOP;
END $$;

-- =====================================================
-- Create policies for driver-profiles bucket
-- =====================================================

-- INSERT: Allow uploading files
CREATE POLICY "driver-profiles-insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-profiles');

-- SELECT: Allow viewing/downloading files (THIS FIXES VIEWING!)
CREATE POLICY "driver-profiles-select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-profiles');

-- UPDATE: Allow updating/moving files
CREATE POLICY "driver-profiles-update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- DELETE: Allow deleting files
CREATE POLICY "driver-profiles-delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-profiles');

-- =====================================================
-- Create policies for driver-documents bucket
-- =====================================================

-- INSERT: Allow uploading documents (THIS FIXES UPLOADING!)
CREATE POLICY "driver-documents-insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents');

-- SELECT: Allow viewing/downloading documents (THIS FIXES VIEWING!)
CREATE POLICY "driver-documents-select"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'driver-documents');

-- UPDATE: Allow updating/moving documents
CREATE POLICY "driver-documents-update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- DELETE: Allow deleting documents
CREATE POLICY "driver-documents-delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents');

-- =====================================================
-- Verify all policies were created
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  CASE WHEN 'authenticated' = ANY(roles) THEN '✓' ELSE '✗' END as has_authenticated,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Fixes viewing/downloading'
    WHEN cmd = 'INSERT' THEN 'Fixes uploading'
    WHEN cmd = 'UPDATE' THEN 'Fixes file operations'
    WHEN cmd = 'DELETE' THEN 'Fixes cleanup'
  END as purpose
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'driver-%'
ORDER BY policyname, cmd;

-- Expected output: 8 policies total
-- driver-documents: DELETE, INSERT, SELECT, UPDATE
-- driver-profiles: DELETE, INSERT, SELECT, UPDATE


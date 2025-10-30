-- =====================================================
-- CORRECTED: Create ALL Required Policies for Driver Storage
-- NO "IF NOT EXISTS" - PostgreSQL doesn't support it for CREATE POLICY
-- =====================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Step 1: Drop existing policies to avoid conflicts
-- =====================================================
DROP POLICY IF EXISTS "driver-profiles-insert" ON storage.objects;
DROP POLICY IF EXISTS "driver-profiles-select" ON storage.objects;
DROP POLICY IF EXISTS "driver-profiles-update" ON storage.objects;
DROP POLICY IF EXISTS "driver-profiles-delete" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-insert" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-select" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-update" ON storage.objects;
DROP POLICY IF EXISTS "driver-documents-delete" ON storage.objects;

-- =====================================================
-- Step 2: Create policies for driver-profiles bucket
-- =====================================================

-- INSERT: Allow uploading files
CREATE POLICY "driver-profiles-insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-profiles');

-- SELECT: Allow viewing/downloading files
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
-- Step 3: Create policies for driver-documents bucket
-- =====================================================

-- INSERT: Allow uploading documents
CREATE POLICY "driver-documents-insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents');

-- SELECT: Allow viewing/downloading documents
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

-- You should see 8 policies:
-- driver-documents: DELETE, INSERT, SELECT, UPDATE
-- driver-profiles: DELETE, INSERT, SELECT, UPDATE


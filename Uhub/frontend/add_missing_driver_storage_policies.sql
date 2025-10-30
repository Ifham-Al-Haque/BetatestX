-- =====================================================
-- Add Missing UPDATE and DELETE Policies for Driver Storage
-- Run this in Supabase SQL Editor
-- =====================================================

-- Note: If you get "must be owner" error, use the Dashboard UI instead
-- (See instructions below)

-- =====================================================
-- For driver-profiles bucket
-- =====================================================

-- Policy for UPDATE operation
CREATE POLICY "Driver profiles UPDATE access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- Policy for DELETE operation
CREATE POLICY "Driver profiles DELETE access"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-profiles');

-- =====================================================
-- For driver-documents bucket
-- =====================================================

-- Policy for UPDATE operation
CREATE POLICY "Driver documents UPDATE access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- Policy for DELETE operation
CREATE POLICY "Driver documents DELETE access"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents');

-- =====================================================
-- Verify all policies now exist
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN 'authenticated' = ANY(roles) THEN '✓ Has authenticated'
    ELSE '✗ Missing authenticated'
  END as has_authenticated_role
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR qual::text LIKE '%driver-documents%'
    OR with_check::text LIKE '%driver-documents%'
  )
ORDER BY policyname, cmd;


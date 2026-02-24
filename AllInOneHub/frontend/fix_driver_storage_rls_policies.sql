-- =====================================================
-- Fix Driver Storage RLS Policies
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policies for 'driver-profiles' bucket
-- =====================================================

-- Policy: Allow authenticated users to upload profile pictures
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload driver profiles"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-profiles' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- Policy: Allow authenticated users to read driver profiles
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read driver profiles"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-profiles' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- Policy: Allow authenticated users to update their own driver profiles
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update driver profiles"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-profiles' AND
  (storage.foldername(name))[1] = 'drivers'
)
WITH CHECK (
  bucket_id = 'driver-profiles' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- Policy: Allow authenticated users to delete driver profiles
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete driver profiles"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-profiles' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- =====================================================
-- Policies for 'driver-documents' bucket
-- =====================================================

-- Policy: Allow authenticated users to upload driver documents
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload driver documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- Policy: Allow authenticated users to read driver documents
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read driver documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- Policy: Allow authenticated users to update driver documents
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update driver documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = 'drivers'
)
WITH CHECK (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- Policy: Allow authenticated users to delete driver documents
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete driver documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-documents' AND
  (storage.foldername(name))[1] = 'drivers'
);

-- =====================================================
-- Alternative: Simpler policies (less restrictive)
-- Use these if you want all authenticated users to access all driver files
-- =====================================================

/*
-- Simpler policy for driver-profiles (all operations)
CREATE POLICY IF NOT EXISTS "Driver profiles full access for authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- Simpler policy for driver-documents (all operations)
CREATE POLICY IF NOT EXISTS "Driver documents full access for authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');
*/

-- =====================================================
-- Verify the policies were created
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;


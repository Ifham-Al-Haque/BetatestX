-- =====================================================
-- QUICK FIX - Run this in Supabase SQL Editor
-- This fixes the RLS policy error for driver uploads
-- =====================================================

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Driver profiles full access for authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Driver documents full access for authenticated" ON storage.objects;

-- Policy for driver-profiles bucket
CREATE POLICY "Driver profiles full access for authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-profiles')
WITH CHECK (bucket_id = 'driver-profiles');

-- Policy for driver-documents bucket
CREATE POLICY "Driver documents full access for authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'driver-documents')
WITH CHECK (bucket_id = 'driver-documents');

-- Verify the policies were created
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%driver%' OR policyname LIKE '%Driver%')
ORDER BY policyname;


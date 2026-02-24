-- =====================================================
-- Simple Fix for Driver Storage RLS Policies
-- Quick solution - run this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Simple policies: Allow all authenticated users 
-- to perform all operations on driver storage buckets
-- =====================================================

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

-- =====================================================
-- Verify buckets exist (create if they don't)
-- =====================================================

-- Note: Buckets should be created through Supabase Dashboard
-- Storage section, but if needed, uncomment below:

/*
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('driver-profiles', 'driver-profiles', true),
  ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- Check if policies were created successfully
-- =====================================================

SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%driver%'
ORDER BY policyname;


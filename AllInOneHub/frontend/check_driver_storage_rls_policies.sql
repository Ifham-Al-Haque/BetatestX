-- =====================================================
-- Check RLS Policies for Driver Storage Buckets
-- Run these queries in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Check if RLS is enabled on storage.objects
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- =====================================================
-- 2. List ALL policies on storage.objects
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  roles,
  qual as using_expression,
  with_check as with_check_expression,
  permissive
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 3. Check specifically for driver-profiles policies
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%driver%' 
    OR policyname LIKE '%Driver%'
    OR qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR qual::text LIKE '%driver-documents%'
    OR with_check::text LIKE '%driver-documents%'
  )
ORDER BY policyname, cmd;

-- =====================================================
-- 4. Check if buckets exist
-- =====================================================
SELECT 
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name IN ('driver-profiles', 'driver-documents')
ORDER BY name;

-- =====================================================
-- 5. Check policies for specific bucket (driver-profiles)
-- =====================================================
SELECT 
  p.policyname,
  p.cmd as operation,
  p.roles,
  p.qual as using_expression,
  p.with_check as with_check_expression,
  CASE 
    WHEN p.qual::text LIKE '%driver-profiles%' THEN '✓ Matches driver-profiles'
    WHEN p.with_check::text LIKE '%driver-profiles%' THEN '✓ Matches driver-profiles'
    ELSE '✗ Does not match driver-profiles'
  END as bucket_match
FROM pg_policies p
WHERE p.schemaname = 'storage'
  AND p.tablename = 'objects'
  AND (
    p.qual::text LIKE '%driver-profiles%'
    OR p.with_check::text LIKE '%driver-profiles%'
    OR p.policyname LIKE '%driver%profile%'
    OR p.policyname LIKE '%Driver%Profile%'
  )
ORDER BY p.cmd, p.policyname;

-- =====================================================
-- 6. Detailed policy information with formatted output
-- =====================================================
SELECT 
  'Policy Name' as info_type,
  policyname as value
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR policyname LIKE '%driver%'
  )
UNION ALL
SELECT 
  'Operation' as info_type,
  cmd::text as value
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR policyname LIKE '%driver%'
  )
UNION ALL
SELECT 
  'Target Roles' as info_type,
  array_to_string(roles, ', ') as value
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR policyname LIKE '%driver%'
  );

-- =====================================================
-- 7. Count policies per operation for driver buckets
-- =====================================================
SELECT 
  cmd as operation,
  COUNT(*) as policy_count,
  array_agg(DISTINCT policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR qual::text LIKE '%driver-documents%'
    OR with_check::text LIKE '%driver-documents%'
    OR policyname LIKE '%driver%'
  )
GROUP BY cmd
ORDER BY cmd;

-- =====================================================
-- 8. Check if authenticated role has any policies
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN 'authenticated' = ANY(roles) THEN '✓ Has authenticated role'
    ELSE '✗ Missing authenticated role'
  END as authenticated_access,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    qual::text LIKE '%driver-profiles%'
    OR with_check::text LIKE '%driver-profiles%'
    OR qual::text LIKE '%driver-documents%'
    OR with_check::text LIKE '%driver-documents%'
  )
ORDER BY policyname;

-- =====================================================
-- 9. Summary: What's missing?
-- =====================================================
WITH required_ops AS (
  SELECT unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) as operation
),
bucket_policies AS (
  SELECT DISTINCT
    cmd as operation
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      qual::text LIKE '%driver-profiles%'
      OR with_check::text LIKE '%driver-profiles%'
      OR qual::text LIKE '%driver-documents%'
      OR with_check::text LIKE '%driver-documents%'
    )
)
SELECT 
  r.operation,
  CASE 
    WHEN b.operation IS NOT NULL THEN '✓ Policy exists'
    ELSE '✗ MISSING - Need to create policy'
  END as status
FROM required_ops r
LEFT JOIN bucket_policies b ON r.operation = b.operation
ORDER BY r.operation;


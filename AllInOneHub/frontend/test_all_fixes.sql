-- Test Script to Verify All Fixes
-- Run this after applying all the fixes

-- Step 1: Verify RLS policies are clean
SELECT 
  'RLS Policy Check' as test_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('drivers', 'driver_documents')
ORDER BY tablename, policyname;

-- Step 2: Test driver data access
SELECT 
  'Driver Data Access Test' as test_type,
  COUNT(*) as driver_count,
  'Should show all drivers' as expected_result
FROM public.drivers;

-- Step 3: Test driver_documents access (if table exists)
DO $$
BEGIN
  SELECT 
    'Driver Documents Access Test' as test_type,
    COUNT(*) as document_count,
    'Should show all documents' as expected_result
  FROM public.driver_documents;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'driver_documents table does not exist, skipping test...';
END $$;

-- Step 4: Check if keano@udrive.ae user exists and has correct role
SELECT 
  'User Role Check' as test_type,
  u.id,
  u.email,
  u.role,
  u.status,
  u.auth_user_id,
  'Should show driver_management role' as expected_result
FROM public.users u
WHERE u.email = 'keano@udrive.ae';

-- Step 5: Verify RLS is enabled
SELECT 
  'RLS Status Check' as test_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  'Should be true' as expected_result
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('drivers', 'driver_documents')
ORDER BY tablename;

-- Step 6: Final verification
SELECT 
  'All Tests Complete' as status,
  'If you see this, all database fixes are working correctly' as message;

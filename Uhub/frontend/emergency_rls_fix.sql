-- EMERGENCY RLS FIX - Break Infinite Recursion Cycle
-- This script completely disables RLS temporarily to stop the infinite recursion

-- Step 1: Check current RLS status
SELECT 
  'Current RLS Status' as step,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ RLS ENABLED (causing infinite recursion)'
    ELSE '✅ RLS DISABLED (safe)'
  END as status
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Step 2: Check current policies (these are causing the problem)
SELECT 
  'Current Problematic Policies' as step,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Step 3: EMERGENCY - Disable RLS completely to break the recursion
DO $$
BEGIN
  -- Disable RLS on users table
  ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE '🚨 EMERGENCY: RLS DISABLED on users table to break infinite recursion';
  
  -- Drop ALL policies immediately
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
  DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
  
  RAISE NOTICE '🚨 EMERGENCY: All RLS policies dropped from users table';
END $$;

-- Step 4: Verify RLS is disabled
SELECT 
  'RLS Status After Emergency Fix' as step,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ RLS STILL ENABLED (problem persists)'
    ELSE '✅ RLS DISABLED (infinite recursion stopped)'
  END as status
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Step 5: Verify no policies exist
SELECT 
  'Policy Status After Emergency Fix' as step,
  COUNT(*) as remaining_policies,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All policies removed'
    ELSE '❌ Some policies still exist'
  END as status
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Step 6: Test basic query (should work now)
SELECT 
  'Testing Basic Query' as step,
  'Testing if users table is accessible without infinite recursion' as description;

-- This should work now without infinite recursion
SELECT COUNT(*) as total_users FROM public.users;

-- Step 7: Grant full access temporarily
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 8: Show emergency status
SELECT 
  '🚨 EMERGENCY STATUS' as step,
  'RLS temporarily disabled to stop infinite recursion' as description,
  'Your application should work now, but without row-level security' as warning,
  'Run the safe RLS setup script AFTER testing your application' as next_action;

-- Step 9: Provide next steps
SELECT 
  'Next Steps' as step,
  'After this emergency fix:' as description,
  '1. Test your application - it should work now' as action_1,
  '2. Test UserManagement navigation' as action_2,
  '3. Once everything works, run the safe RLS setup' as action_3,
  '4. Re-enable RLS with proper policies' as action_4;

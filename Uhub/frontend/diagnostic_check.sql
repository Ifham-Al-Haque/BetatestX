-- Comprehensive Diagnostic Check for RLS and Authentication Issues
-- Run this in your Supabase SQL Editor

-- 1. Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('employees', 'expenses', 'assets', 'payment_events', 'payments', 'tickets', 'access_request', 'employee_access', 'activity_logs', 'access_items');

-- 2. List all existing RLS policies
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check if auth.users table exists and has data
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 4. Check if the current user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  role
FROM auth.users 
LIMIT 5;

-- 5. Test a simple query to see if basic access works
-- This should work if RLS is properly configured
SELECT COUNT(*) as employees_count FROM employees;

-- 6. Check if there are any existing policies that might conflict
SELECT 
  'Conflicting Policies' as check_type,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 2;

-- 7. Verify table structure for key tables
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'employees'
ORDER BY ordinal_position;

-- 8. Check if there are any triggers that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('employees', 'expenses', 'assets', 'payment_events');

-- 9. Test RLS policy effectiveness
-- This will show if the policies are working
DO $$
BEGIN
  -- Test if we can read from employees table
  IF EXISTS (SELECT 1 FROM employees LIMIT 1) THEN
    RAISE NOTICE '✅ RLS allows reading from employees table';
  ELSE
    RAISE NOTICE '❌ RLS blocks reading from employees table';
  END IF;
  
  -- Test if we can read from expenses table
  IF EXISTS (SELECT 1 FROM expenses LIMIT 1) THEN
    RAISE NOTICE '✅ RLS allows reading from expenses table';
  ELSE
    RAISE NOTICE '❌ RLS blocks reading from expenses table';
  END IF;
  
  -- Test if we can read from assets table
  IF EXISTS (SELECT 1 FROM assets LIMIT 1) THEN
    RAISE NOTICE '✅ RLS allows reading from assets table';
  ELSE
    RAISE NOTICE '❌ RLS blocks reading from assets table';
  END IF;
  
  -- Test if we can read from payment_events table
  IF EXISTS (SELECT 1 FROM payment_events LIMIT 1) THEN
    RAISE NOTICE '✅ RLS allows reading from payment_events table';
  ELSE
    RAISE NOTICE '❌ RLS blocks reading from payment_events table';
  END IF;
END $$; 
-- Diagnostic Script for Users Table RLS Infinite Recursion
-- Run this in your Supabase SQL Editor to identify the problem

-- 1. Check if the users table exists and has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled' 
    ELSE '❌ RLS Disabled' 
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 2. List all existing policies on the users table with their definitions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  CASE 
    WHEN qual LIKE '%users%' THEN '⚠️ POTENTIAL RECURSION - Policy references users table'
    WHEN with_check LIKE '%users%' THEN '⚠️ POTENTIAL RECURSION - Policy references users table'
    ELSE '✅ No direct users table reference'
  END as recursion_risk
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 3. Check if there are any functions that might be causing recursion
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%users%'
  AND n.nspname = 'public';

-- 4. Check for any triggers on the users table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table = 'users';

-- 5. Check if there are any views that reference the users table
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
  AND view_definition LIKE '%users%';

-- 6. Test a simple query to see the exact error
DO $$
BEGIN
  RAISE NOTICE 'Testing users table query...';
  
  BEGIN
    PERFORM COUNT(*) FROM users;
    RAISE NOTICE '✅ Users table query successful - no recursion detected';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Error querying users table: %', SQLERRM;
      RAISE NOTICE 'Error details: %', SQLSTATE;
  END;
END $$;

-- 7. Check for any circular references in foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'users';

-- 8. Check the current user context
SELECT 
  current_user,
  current_setting('role'),
  current_setting('search_path');

-- 9. Check if there are any RLS bypass settings
SELECT 
  name,
  setting,
  context
FROM pg_settings 
WHERE name IN ('row_security', 'enable_rls');

-- 10. Summary of findings
SELECT 
  'Diagnostic Summary' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND (qual LIKE '%users%' OR with_check LIKE '%users%')
    ) THEN '❌ RECURSION RISK DETECTED - Policies reference users table'
    ELSE '✅ No obvious recursion risks in policies'
  END as finding;

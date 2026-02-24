-- Diagnostic Script for keano@udrive.ae Authentication Issue
-- Run this to identify the exact problem

-- 1. Check if keano@udrive.ae exists in auth.users
SELECT 
  'Auth Users Check' as check_type,
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'keano@udrive.ae';

-- 2. Check if keano@udrive.ae exists in users table
SELECT 
  'Users Table Check' as check_type,
  id,
  email,
  auth_user_id,
  employee_id,
  role,
  status,
  full_name,
  department,
  position,
  created_at,
  updated_at
FROM public.users 
WHERE email = 'keano@udrive.ae';

-- 3. Check if keano@udrive.ae exists in employees table
SELECT 
  'Employees Table Check' as check_type,
  id,
  full_name,
  email,
  department,
  position,
  employee_id,
  created_at,
  updated_at
FROM public.employees 
WHERE email = 'keano@udrive.ae';

-- 4. Check RLS status on both tables
SELECT 
  'RLS Status Check' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'employees');

-- 5. List all RLS policies on users and employees tables
SELECT 
  'RLS Policies Check' as check_type,
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
  AND tablename IN ('users', 'employees')
ORDER BY tablename, policyname;

-- 6. Check table structure for users table
SELECT 
  'Users Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 7. Check table structure for employees table
SELECT 
  'Employees Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'employees'
ORDER BY ordinal_position;

-- 8. Test basic access to users table (this will show if RLS is blocking)
SELECT 
  'Users Table Access Test' as check_type,
  COUNT(*) as total_users
FROM public.users;

-- 9. Test basic access to employees table (this will show if RLS is blocking)
SELECT 
  'Employees Table Access Test' as check_type,
  COUNT(*) as total_employees
FROM public.employees;

-- 10. Check for any foreign key constraints
SELECT 
  'Foreign Key Constraints' as check_type,
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
  AND tc.table_name IN ('users', 'employees')
  AND tc.table_schema = 'public';

-- 11. Check for any triggers that might interfere
SELECT 
  'Triggers Check' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('users', 'employees');

-- 12. Check if there are any check constraints that might be failing
SELECT 
  'Check Constraints' as check_type,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name IN ('users', 'employees')
  AND tc.table_schema = 'public';

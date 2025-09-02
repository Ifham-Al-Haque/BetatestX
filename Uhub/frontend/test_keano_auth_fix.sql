-- Test Script for Keano Authentication Fix
-- Run this after applying the main fix to verify everything works

-- 1. Test basic table access (should work if RLS is fixed)
SELECT 'Testing table access...' as test_step;

-- Test users table access
SELECT COUNT(*) as users_count FROM public.users;

-- Test employees table access  
SELECT COUNT(*) as employees_count FROM public.employees;

-- 2. Check keano@udrive.ae records specifically
SELECT 'Checking keano@udrive.ae records...' as test_step;

-- Check auth.users
SELECT 
  'Auth User' as record_type,
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'keano@udrive.ae';

-- Check users table
SELECT 
  'Users Table' as record_type,
  id,
  email,
  auth_user_id,
  employee_id,
  role,
  status,
  full_name,
  department,
  position
FROM public.users 
WHERE email = 'keano@udrive.ae';

-- Check employees table
SELECT 
  'Employees Table' as record_type,
  id,
  full_name,
  email,
  department,
  position,
  employee_id
FROM public.employees 
WHERE email = 'keano@udrive.ae';

-- 3. Test the relationship between tables
SELECT 'Testing table relationships...' as test_step;

SELECT 
  u.email,
  u.role,
  u.status,
  u.full_name as user_name,
  u.department as user_dept,
  u.position as user_position,
  e.full_name as employee_name,
  e.department as employee_dept,
  e.position as employee_position,
  e.employee_id
FROM public.users u
LEFT JOIN public.employees e ON u.employee_id = e.id
WHERE u.email = 'keano@udrive.ae';

-- 4. Test RLS policies
SELECT 'Testing RLS policies...' as test_step;

-- This should return the policy names if they exist
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'employees')
  AND policyname LIKE '%authenticated%';

-- 5. Final verification
SELECT 'Final verification...' as test_step;

-- Check if keano has the correct role
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'keano@udrive.ae' 
      AND role = 'driver_management'
    ) THEN '✅ Role correctly set to driver_management'
    ELSE '❌ Role not set correctly'
  END as role_check;

-- Check if keano has an employee record
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.employees 
      WHERE email = 'keano@udrive.ae'
    ) THEN '✅ Employee record exists'
    ELSE '❌ Employee record missing'
  END as employee_check;

-- Check if the relationship is properly linked
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.employees e ON u.employee_id = e.id
      WHERE u.email = 'keano@udrive.ae'
    ) THEN '✅ User-Employee relationship properly linked'
    ELSE '❌ User-Employee relationship not linked'
  END as relationship_check;

SELECT 'Test completed!' as final_status;

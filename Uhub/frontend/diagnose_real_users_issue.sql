-- Diagnose Real Users Issue
-- This script helps identify why real users aren't showing up in task assignment

-- Step 1: Check if users table has data
SELECT 
  'Users Table Check' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != '' AND department != 'N/A' THEN 1 END) as users_with_departments
FROM users;

-- Step 2: Show all users (first 20)
SELECT 
  'All Users in Database' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 20;

-- Step 3: Check department distribution
SELECT 
  'Department Distribution' as step,
  department,
  COUNT(*) as user_count,
  STRING_AGG(COALESCE(full_name, email), ', ') as users
FROM users 
WHERE department IS NOT NULL AND department != ''
GROUP BY department
ORDER BY user_count DESC;

-- Step 4: Check users with missing or invalid departments
SELECT 
  'Users with Missing/Invalid Departments' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status
FROM users 
WHERE department IS NULL 
   OR department = '' 
   OR department = 'Unassigned' 
   OR department = 'N/A'
ORDER BY created_at DESC;

-- Step 5: Check RLS policies on users table
SELECT 
  'RLS Policies on Users Table' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Step 6: Check if RLS is enabled on users table
SELECT 
  'RLS Status on Users Table' as step,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- Step 7: Check user permissions
SELECT 
  'Current User Permissions' as step,
  current_user as current_user,
  session_user as session_user,
  current_database() as current_database;

-- Step 8: Test basic select on users table
SELECT 
  'Basic Select Test' as step,
  COUNT(*) as can_read_users
FROM users;

-- Step 9: Check if there are any constraints or issues
SELECT 
  'Table Constraints' as step,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'users';

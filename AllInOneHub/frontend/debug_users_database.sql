-- Debug script to check users table and data
-- Run this in your database to diagnose the issue

-- Step 1: Check if users table exists and has data
SELECT 
  'Users Table Check' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != '' THEN 1 END) as users_with_departments
FROM users;

-- Step 2: Show all users (first 10)
SELECT 
  'Sample Users Data' as step,
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
LIMIT 10;

-- Step 3: Check department distribution
SELECT 
  'Department Distribution' as step,
  department,
  COUNT(*) as user_count
FROM users 
WHERE department IS NOT NULL AND department != ''
GROUP BY department
ORDER BY user_count DESC;

-- Step 4: Check for users with missing departments
SELECT 
  'Users with Missing Departments' as step,
  id,
  email,
  full_name,
  role,
  department,
  status
FROM users 
WHERE department IS NULL 
   OR department = '' 
   OR department = 'Unassigned' 
   OR department = 'N/A'
ORDER BY created_at DESC;

-- Step 5: Check RLS policies on users table
SELECT 
  'RLS Policies Check' as step,
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

-- Step 6: Check if RLS is enabled
SELECT 
  'RLS Status Check' as step,
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE tablename = 'users';

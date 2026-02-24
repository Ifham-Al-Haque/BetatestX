-- Check Existing Users in Database
-- This script shows what users you currently have

-- Step 1: Count all users
SELECT 
  'Total Users Count' as step,
  COUNT(*) as total_users
FROM users;

-- Step 2: Show all users with their details
SELECT 
  'All Users Details' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status,
  created_at,
  updated_at
FROM users 
ORDER BY created_at DESC;

-- Step 3: Check users by status
SELECT 
  'Users by Status' as step,
  status,
  COUNT(*) as count
FROM users 
GROUP BY status
ORDER BY count DESC;

-- Step 4: Check users by role
SELECT 
  'Users by Role' as step,
  role,
  COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY count DESC;

-- Step 5: Check users by department
SELECT 
  'Users by Department' as step,
  department,
  COUNT(*) as count
FROM users 
GROUP BY department
ORDER BY count DESC;

-- Step 6: Show users that can be used for task assignment
SELECT 
  'Users Available for Task Assignment' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != '' 
  AND department != 'N/A'
ORDER BY department, full_name;

-- Step 7: Show users that need department assignment
SELECT 
  'Users Needing Department Assignment' as step,
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
   OR department = 'N/A'
   OR department = 'Unassigned'
ORDER BY created_at DESC;

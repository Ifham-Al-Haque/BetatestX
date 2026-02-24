-- Simple Users Check
-- This script checks what users exist and why they might not be showing up

-- Step 1: Count all users
SELECT 
  'Total Users' as step,
  COUNT(*) as count
FROM users;

-- Step 2: Show all users (first 10)
SELECT 
  'Sample Users' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 3: Check users by status
SELECT 
  'Users by Status' as step,
  status,
  COUNT(*) as count
FROM users 
GROUP BY status;

-- Step 4: Check users by department
SELECT 
  'Users by Department' as step,
  department,
  COUNT(*) as count
FROM users 
GROUP BY department
ORDER BY count DESC;

-- Step 5: Show users that can be used for task assignment
SELECT 
  'Users Available for Tasks' as step,
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

-- Step 6: Show users that need department assignment
SELECT 
  'Users Needing Department' as step,
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

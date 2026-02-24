-- Verify User Roles and RBAC System Status
-- Run this in your Supabase SQL editor to check the current state

-- Step 1: Check all employees and their roles
SELECT 
  id,
  email,
  role,
  full_name,
  department,
  position,
  auth_user_id,
  status,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ NO AUTH ACCOUNT'
    ELSE '✅ HAS AUTH ACCOUNT'
  END as auth_status,
  created_at,
  updated_at
FROM employees
ORDER BY 
  CASE WHEN auth_user_id IS NULL THEN 0 ELSE 1 END,
  role,
  email;

-- Step 2: Count users by role
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(auth_user_id) as users_with_auth,
  COUNT(*) - COUNT(auth_user_id) as users_without_auth
FROM employees
GROUP BY role
ORDER BY role;

-- Step 3: Check specific problematic users
SELECT 
  e.id as employee_id,
  e.email,
  e.role,
  e.full_name,
  e.auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  CASE 
    WHEN e.auth_user_id IS NULL THEN '❌ NO AUTH ACCOUNT'
    WHEN au.email IS NULL THEN '❌ AUTH ACCOUNT NOT FOUND'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
    ELSE '✅ FULLY ACTIVE'
  END as status
FROM employees e
LEFT JOIN auth.users au ON e.auth_user_id = au.id
WHERE e.email IN ('nagma@udrive.ae', 'ifham@udrive.ae')
ORDER BY e.email;

-- Step 4: Check for users with missing auth accounts
SELECT 
  e.email,
  e.role,
  e.full_name,
  e.department,
  e.created_at
FROM employees e
WHERE e.auth_user_id IS NULL
ORDER BY e.created_at DESC;

-- Step 5: Check for auth users without employee records
SELECT 
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
LEFT JOIN employees e ON au.email = e.email
WHERE e.email IS NULL
ORDER BY au.created_at DESC;

-- Step 6: Verify role distribution
SELECT 
  role,
  COUNT(*) as total_users,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 2) as percentage
FROM employees
GROUP BY role
ORDER BY total_users DESC;

-- Step 7: Check for any data inconsistencies
SELECT 
  'Duplicate emails' as issue_type,
  email,
  COUNT(*) as count
FROM employees
GROUP BY email
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'Duplicate auth_user_ids' as issue_type,
  auth_user_id::text,
  COUNT(*) as count
FROM employees
WHERE auth_user_id IS NOT NULL
GROUP BY auth_user_id
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'Invalid roles' as issue_type,
  role,
  COUNT(*) as count
FROM employees
WHERE role NOT IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer')
GROUP BY role;

-- Step 8: Create a summary view for easy monitoring
CREATE OR REPLACE VIEW user_rbac_summary AS
SELECT 
  e.id as employee_id,
  e.email,
  e.role,
  e.full_name,
  e.department,
  e.auth_user_id,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  e.created_at as employee_created_at,
  CASE 
    WHEN e.auth_user_id IS NULL THEN 'No Auth Account'
    WHEN au.email_confirmed_at IS NULL THEN 'Email Not Confirmed'
    WHEN e.role IS NULL THEN 'No Role Assigned'
    ELSE 'Fully Active'
  END as status,
  CASE 
    WHEN e.auth_user_id IS NULL THEN 'red'
    WHEN au.email_confirmed_at IS NULL THEN 'yellow'
    WHEN e.role IS NULL THEN 'orange'
    ELSE 'green'
  END as status_color
FROM employees e
LEFT JOIN auth.users au ON e.auth_user_id = au.id
ORDER BY 
  CASE 
    WHEN e.auth_user_id IS NULL THEN 0
    WHEN au.email_confirmed_at IS NULL THEN 1
    WHEN e.role IS NULL THEN 2
    ELSE 3
  END,
  e.created_at DESC;

-- Step 9: Query the summary view
-- SELECT * FROM user_rbac_summary;

-- Step 10: Get summary statistics
-- SELECT 
--   status,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 2) as percentage
-- FROM user_rbac_summary
-- GROUP BY status
-- ORDER BY count DESC;

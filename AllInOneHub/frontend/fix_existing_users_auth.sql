-- Fix Existing Users Authentication Accounts
-- This script helps identify and fix users who exist in employees table but not in auth.users

-- Step 1: Check current status of all users
SELECT 
  e.id as employee_id,
  e.email,
  e.role,
  e.full_name,
  e.department,
  e.position,
  e.auth_user_id,
  CASE 
    WHEN e.auth_user_id IS NULL THEN '❌ NO AUTH ACCOUNT'
    ELSE '✅ HAS AUTH ACCOUNT'
  END as auth_status,
  e.created_at,
  e.updated_at
FROM employees e
ORDER BY 
  CASE WHEN e.auth_user_id IS NULL THEN 0 ELSE 1 END,
  e.created_at DESC;

-- Step 2: Count users by status
SELECT 
  COUNT(*) as total_users,
  COUNT(e.auth_user_id) as users_with_auth,
  COUNT(*) - COUNT(e.auth_user_id) as users_without_auth
FROM employees e;

-- Step 3: Show users without auth accounts (these need to be fixed)
SELECT 
  e.id as employee_id,
  e.email,
  e.role,
  e.full_name,
  e.department,
  e.position,
  e.created_at
FROM employees e
WHERE e.auth_user_id IS NULL
ORDER BY e.created_at DESC;

-- Step 4: Create a function to help create auth accounts for existing employees
-- Note: This function can only be called from your application, not directly from SQL
-- because Supabase Auth operations require the client SDK

-- Step 5: Update employee records after auth accounts are created
-- (Run this after creating auth accounts in Supabase Dashboard or through your app)

-- Example: After creating auth account for nagma@udrive.ae
-- UPDATE employees 
-- SET 
--   auth_user_id = 'UUID_FROM_SUPABASE_AUTH',
--   updated_at = NOW()
-- WHERE email = 'nagma@udrive.ae';

-- Step 6: Verify the fix
-- SELECT 
--   e.id as employee_id,
--   e.email,
--   e.role,
--   e.full_name,
--   e.auth_user_id,
--   au.email_confirmed_at,
--   au.created_at as auth_created_at
-- FROM employees e
-- LEFT JOIN auth.users au ON e.auth_user_id = au.id
-- WHERE e.email = 'nagma@udrive.ae';

-- Step 7: Check for any remaining users without auth accounts
-- SELECT 
--   COUNT(*) as remaining_users_without_auth
-- FROM employees e
-- WHERE e.auth_user_id IS NULL;

-- Step 8: Create a view for easy monitoring
CREATE OR REPLACE VIEW user_auth_status AS
SELECT 
  e.id as employee_id,
  e.email,
  e.role,
  e.full_name,
  e.department,
  e.position,
  e.auth_user_id,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  e.created_at as employee_created_at,
  e.updated_at as employee_updated_at,
  CASE 
    WHEN e.auth_user_id IS NULL THEN 'No Auth Account'
    WHEN au.email_confirmed_at IS NULL THEN 'Auth Account - Email Not Confirmed'
    ELSE 'Fully Active'
  END as status,
  CASE 
    WHEN e.auth_user_id IS NULL THEN 'red'
    WHEN au.email_confirmed_at IS NULL THEN 'yellow'
    ELSE 'green'
  END as status_color
FROM employees e
LEFT JOIN auth.users au ON e.auth_user_id = au.id
ORDER BY 
  CASE 
    WHEN e.auth_user_id IS NULL THEN 0
    WHEN au.email_confirmed_at IS NULL THEN 1
    ELSE 2
  END,
  e.created_at DESC;

-- Step 9: Query the view for easy monitoring
-- SELECT * FROM user_auth_status;

-- Step 10: Get summary statistics
-- SELECT 
--   status,
--   COUNT(*) as count,
--   ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees), 2) as percentage
-- FROM user_auth_status
-- GROUP BY status
-- ORDER BY count DESC;

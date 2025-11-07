-- Diagnostic SQL to check Rayan.Paul@udrive.ae user status
-- Run this in your Supabase SQL Editor

-- Step 1: Check user in users table
SELECT 
  id,
  email,
  auth_user_id,
  full_name,
  status,
  department,
  role,
  created_at
FROM users 
WHERE email = 'Rayan.Paul@udrive.ae';

-- Step 2: Use the RPC function to verify auth user exists (if function is installed)
-- This will return true/false/null
SELECT 
  'RPC Verification' as check_type,
  verify_auth_user_exists(
    (SELECT auth_user_id FROM users WHERE email = 'Rayan.Paul@udrive.ae')
  ) as auth_user_exists;

-- Step 3: Get user details with auth verification
-- This uses a LEFT JOIN approach that should work
SELECT 
  u.email,
  u.auth_user_id,
  u.full_name,
  u.status,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ NO auth_user_id'
    WHEN verify_auth_user_exists(u.auth_user_id) = true THEN '✅ auth_user_id EXISTS in auth.users'
    WHEN verify_auth_user_exists(u.auth_user_id) = false THEN '❌ auth_user_id DOES NOT EXIST in auth.users'
    ELSE '⚠️ Could not verify (RPC function may not be available)'
  END as auth_status
FROM users u
WHERE u.email = 'Rayan.Paul@udrive.ae';

-- Step 4: Alternative - Simple check without RPC (may not work due to permissions)
-- If you have access to auth.users, try this:
/*
SELECT 
  u.email,
  u.auth_user_id,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ NO auth_user_id'
    WHEN EXISTS (
      SELECT 1 FROM auth.users au WHERE au.id = u.auth_user_id
    ) THEN '✅ auth_user_id EXISTS in auth.users'
    ELSE '❌ auth_user_id DOES NOT EXIST in auth.users'
  END as auth_status
FROM users u
WHERE u.email = 'Rayan.Paul@udrive.ae';
*/

-- Step 5: Check all users with potential auth issues (using RPC if available)
SELECT 
  email,
  full_name,
  auth_user_id,
  status,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ NO auth_user_id'
    WHEN verify_auth_user_exists(auth_user_id) = false THEN '❌ auth_user_id DOES NOT EXIST'
    WHEN verify_auth_user_exists(auth_user_id) = true THEN '✅ Valid'
    ELSE '⚠️ Unknown'
  END as auth_status
FROM users 
WHERE email = 'Rayan.Paul@udrive.ae'
ORDER BY email;


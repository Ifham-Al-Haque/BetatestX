-- Check if nagma@udrive.ae and hr@udrive.ae have proper auth_user_id linkage
-- Run this in Supabase SQL Editor

-- Step 1: Check in auth.users (Supabase Auth)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  encrypted_password
FROM auth.users 
WHERE email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY email;

-- Step 2: Check in users table (Application users)
SELECT 
  id,
  email,
  auth_user_id,
  role,
  status,
  created_at
FROM users 
WHERE email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY email;

-- Step 3: Check the linkage between auth.users and users table
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.email_confirmed_at,
  u.id as user_id,
  u.auth_user_id,
  u.role,
  u.status,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ NO LINKAGE'
    WHEN u.auth_user_id = au.id THEN '✅ PROPERLY LINKED'
    ELSE '⚠️ MISMATCH'
  END as linkage_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.auth_user_id
WHERE au.email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY au.email;

-- Step 4: If auth_user_id is missing, this will show what needs to be fixed
SELECT 
  u.id,
  u.email,
  u.role,
  u.status,
  au.id as auth_user_id_from_auth,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ MISSING auth_user_id'
    WHEN u.auth_user_id IS NOT NULL THEN '✅ HAS auth_user_id'
  END as status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY u.email;

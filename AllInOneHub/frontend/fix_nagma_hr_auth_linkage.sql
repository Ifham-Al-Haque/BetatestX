-- Fix auth_user_id linkage for nagma@udrive.ae and hr@udrive.ae
-- Run this in Supabase SQL Editor

-- Step 1: Update nagma@udrive.ae
UPDATE users u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.email = 'nagma@udrive.ae' 
  AND au.email = 'nagma@udrive.ae'
  AND u.auth_user_id IS NULL;

-- Step 2: Update hr@udrive.ae
UPDATE users u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.email = 'hr@udrive.ae' 
  AND au.email = 'hr@udrive.ae'
  AND u.auth_user_id IS NULL;

-- Step 3: Verify the fix
SELECT 
  u.id,
  u.email,
  u.auth_user_id,
  u.role,
  u.status,
  au.id as auth_id,
  CASE 
    WHEN u.auth_user_id = au.id THEN '✅ LINKED'
    WHEN u.auth_user_id IS NULL THEN '❌ NOT LINKED'
    ELSE '⚠️ MISMATCH'
  END as status
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY u.email;

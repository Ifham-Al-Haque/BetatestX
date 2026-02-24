-- Fix script for Rayan.Paul@udrive.ae user authentication issue
-- Run this AFTER running diagnose_rayan_user.sql to understand the situation

-- OPTION 1: If auth user exists with same email but different ID
-- Update users table to use the correct auth_user_id
-- 
-- First, find the correct auth_user_id:
-- SELECT id, email FROM auth.users WHERE email = 'Rayan.Paul@udrive.ae';
--
-- Then update (replace 'CORRECT_AUTH_USER_ID' with the actual ID):
-- UPDATE users 
-- SET auth_user_id = 'CORRECT_AUTH_USER_ID'
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- OPTION 2: If auth user doesn't exist at all
-- You need to create the auth user first, then link it
-- 
-- Step 1: Create auth user via Supabase Dashboard:
--   - Go to Authentication > Users > Add User
--   - Email: Rayan.Paul@udrive.ae
--   - Set password
--   - Copy the new user ID
--
-- Step 2: Update users table with the new auth_user_id:
-- UPDATE users 
-- SET auth_user_id = 'NEW_AUTH_USER_ID_FROM_STEP_1'
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- OPTION 3: If the auth_user_id in users table is invalid
-- Set it to NULL temporarily (user won't appear in dropdown until fixed):
-- UPDATE users 
-- SET auth_user_id = NULL
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- OPTION 4: If user should be inactive
-- UPDATE users 
-- SET status = 'inactive'
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- VERIFICATION: After fixing, verify the link:
SELECT 
  u.email,
  u.auth_user_id,
  au.id as auth_users_id,
  au.email as auth_email,
  CASE 
    WHEN u.auth_user_id = au.id THEN '✅ FIXED - Properly linked'
    ELSE '❌ STILL BROKEN'
  END as status
FROM users u
LEFT JOIN auth.users au ON au.id = u.auth_user_id
WHERE u.email = 'Rayan.Paul@udrive.ae';


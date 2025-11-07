-- Fix script for Rayan.Paul@udrive.ae authentication linkage
-- Current auth_user_id: db604037-394c-462c-ad99-b9b2abbbed29

-- STEP 1: First verify the issue
-- Run check_rayan_auth_user.sql to confirm the auth_user_id doesn't exist

-- STEP 2: Choose the appropriate fix below based on your situation

-- ============================================
-- OPTION A: Auth user exists but with different ID
-- ============================================
-- If you found an auth user with email Rayan.Paul@udrive.ae but different ID:
-- 
-- 1. Get the correct auth user ID from Supabase Dashboard:
--    Authentication > Users > Search "Rayan.Paul@udrive.ae" > Copy the ID
--
-- 2. Update users table (replace CORRECT_ID with actual ID):
-- UPDATE users 
-- SET auth_user_id = 'CORRECT_ID_HERE'
-- WHERE email = 'Rayan.Paul@udrive.ae';
--
-- 3. Verify the fix:
-- SELECT 
--   email, 
--   auth_user_id,
--   verify_auth_user_exists(auth_user_id) as verified
-- FROM users 
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- ============================================
-- OPTION B: Auth user doesn't exist at all
-- ============================================
-- If no auth user exists for this email:
--
-- 1. Create auth user via Supabase Dashboard:
--    - Go to Authentication > Users > Add User
--    - Email: Rayan.Paul@udrive.ae
--    - Set a temporary password
--    - Copy the new user ID that gets created
--
-- 2. Update users table with new auth_user_id:
-- UPDATE users 
-- SET auth_user_id = 'NEW_AUTH_USER_ID_FROM_STEP_1'
-- WHERE email = 'Rayan.Paul@udrive.ae';
--
-- 3. Verify the fix:
-- SELECT 
--   email, 
--   auth_user_id,
--   verify_auth_user_exists(auth_user_id) as verified
-- FROM users 
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- ============================================
-- OPTION C: Temporary workaround (set to NULL)
-- ============================================
-- If you can't fix it right now, set auth_user_id to NULL
-- This will exclude the user from task assignment until fixed:
-- UPDATE users 
-- SET auth_user_id = NULL
-- WHERE email = 'Rayan.Paul@udrive.ae';

-- ============================================
-- VERIFICATION QUERY (run after fixing)
-- ============================================
SELECT 
  u.email,
  u.auth_user_id,
  u.status,
  verify_auth_user_exists(u.auth_user_id) as auth_exists,
  CASE 
    WHEN u.auth_user_id IS NULL THEN '❌ No auth_user_id'
    WHEN verify_auth_user_exists(u.auth_user_id) = true THEN '✅ FIXED - Properly linked'
    WHEN verify_auth_user_exists(u.auth_user_id) = false THEN '❌ STILL BROKEN - auth_user_id does not exist'
    ELSE '⚠️ Could not verify'
  END as final_status
FROM users u
WHERE u.email = 'Rayan.Paul@udrive.ae';


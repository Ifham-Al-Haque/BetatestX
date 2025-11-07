-- Check if Rayan.Paul@udrive.ae's auth_user_id exists in auth.users
-- Run this AFTER installing verify_auth_user_exists.sql

-- Method 1: Using the RPC function (recommended)
SELECT 
  'Rayan.Paul@udrive.ae' as email,
  'db604037-394c-462c-ad99-b9b2abbbed29' as auth_user_id,
  verify_auth_user_exists('db604037-394c-462c-ad99-b9b2abbbed29') as exists_in_auth_users,
  CASE 
    WHEN verify_auth_user_exists('db604037-394c-462c-ad99-b9b2abbbed29') = true THEN '✅ User exists in auth.users - Linkage is correct'
    WHEN verify_auth_user_exists('db604037-394c-462c-ad99-b9b2abbbed29') = false THEN '❌ User DOES NOT exist in auth.users - This is the problem!'
    ELSE '⚠️ Could not verify (RPC function may not be installed)'
  END as status;

-- Method 2: Check via Supabase Dashboard
-- If RPC function is not available, manually check:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Search for user ID: db604037-394c-462c-ad99-b9b2abbbed29
-- 3. Or search for email: Rayan.Paul@udrive.ae
-- 4. If found with different ID, that's the mismatch
-- 5. If not found at all, auth user doesn't exist

-- Method 3: If auth user exists with same email but different ID
-- Run this to find the correct auth user ID (if you have access):
/*
SELECT 
  au.id as auth_user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE au.email = 'Rayan.Paul@udrive.ae';
*/


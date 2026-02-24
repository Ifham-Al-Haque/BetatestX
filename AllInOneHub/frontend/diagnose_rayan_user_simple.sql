-- Simple diagnostic SQL for Rayan.Paul@udrive.ae (no auth.users access needed)
-- Run this FIRST to see the basic user data

-- Step 1: Get user data from users table
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

-- Step 2: Check the auth_user_id format
SELECT 
  email,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ NO auth_user_id - User needs auth account created'
    WHEN auth_user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '✅ Valid UUID format'
    ELSE '❌ Invalid UUID format'
  END as uuid_format_check
FROM users 
WHERE email = 'Rayan.Paul@udrive.ae';

-- Step 3: Manual verification steps
-- After running this, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Search for email: Rayan.Paul@udrive.ae
-- 3. If found, copy the user ID and compare with auth_user_id from Step 1
-- 4. If not found, the auth user doesn't exist and needs to be created


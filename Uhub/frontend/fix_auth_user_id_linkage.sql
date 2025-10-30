-- Fix auth_user_id linkage for nagma@udrive.ae and hr@udrive.ae
-- This will update the auth_user_id to match the actual auth.users ID

-- Step 1: Fix nagma@udrive.ae
UPDATE users
SET auth_user_id = '0c7886f7-3c01-4306-82bb-63b3182e1e21'
WHERE email = 'nagma@udrive.ae';

-- Step 2: Fix hr@udrive.ae
UPDATE users
SET auth_user_id = '2dec2124-0440-4f1d-9cfd-20fbdbf8dcce'
WHERE email = 'hr@udrive.ae';

-- Step 3: Verify the fix
SELECT 
  u.id,
  u.email,
  u.auth_user_id as current_auth_user_id,
  au.id as correct_auth_user_id,
  u.role,
  u.status,
  CASE 
    WHEN u.auth_user_id = au.id THEN '✅ CORRECTLY LINKED'
    ELSE '❌ STILL MISMATCH'
  END as linkage_status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY u.email;

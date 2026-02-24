-- Final operation_management user creation script
-- This script creates a test user with operation_management role

-- Step 1: Clean up any existing test user
DELETE FROM public.users WHERE email = 'operation@udrive.ae';
DELETE FROM auth.users WHERE email = 'operation@udrive.ae';

-- Step 2: Create auth user for operation management
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'operation@udrive.ae',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Step 3: Get the auth user ID and create public user record
DO $$
DECLARE
  operation_auth_user_id UUID;
BEGIN
  -- Get the auth user ID
  SELECT id INTO operation_auth_user_id 
  FROM auth.users 
  WHERE email = 'operation@udrive.ae';
  
  IF operation_auth_user_id IS NOT NULL THEN
    -- Create user record in public.users table
    INSERT INTO public.users (
      auth_user_id,
      email,
      role,
      status,
      full_name,
      created_at,
      updated_at
    ) VALUES (
      operation_auth_user_id,
      'operation@udrive.ae',
      'operation_management',
      'active',
      'Operation Manager',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Operation Management user created successfully with auth_user_id: %', operation_auth_user_id;
  ELSE
    RAISE NOTICE 'Auth user not found, something went wrong';
  END IF;
END $$;

-- Step 4: Verify the user was created
SELECT 
  'User Creation Verification' as test_type,
  u.id,
  u.email,
  u.role,
  u.status,
  u.full_name,
  u.auth_user_id,
  'Should show operation_management role' as expected_result
FROM public.users u
WHERE u.email = 'operation@udrive.ae';

-- Step 5: Verify auth user exists
SELECT 
  'Auth User Verification' as test_type,
  au.id,
  au.email,
  au.role,
  'Should show authenticated role' as expected_result
FROM auth.users au
WHERE au.email = 'operation@udrive.ae';

-- Step 6: Final verification
SELECT 
  'Operation Management User Ready' as status,
  'You can now test with operation@udrive.ae / password123' as message;

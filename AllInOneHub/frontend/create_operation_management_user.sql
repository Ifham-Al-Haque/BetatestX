-- Create operation_management user for testing
-- This script creates a test user with operation_management role

-- Step 1: Create auth user for operation management (if not exists)
DO $$
DECLARE
  operation_auth_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO operation_auth_user_id 
  FROM auth.users 
  WHERE email = 'operation@udrive.ae';
  
  -- If user doesn't exist, create it
  IF operation_auth_user_id IS NULL THEN
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
    
    RAISE NOTICE 'Auth user created successfully';
  ELSE
    RAISE NOTICE 'Auth user already exists';
  END IF;
END $$;

-- Step 2: Get the auth user ID
DO $$
DECLARE
  operation_auth_user_id UUID;
BEGIN
  -- Get the auth user ID
  SELECT id INTO operation_auth_user_id 
  FROM auth.users 
  WHERE email = 'operation@udrive.ae';
  
  IF operation_auth_user_id IS NOT NULL THEN
    -- Step 3: Create user record in public.users table
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
    ) ON CONFLICT (auth_user_id) DO UPDATE SET
      role = 'operation_management',
      status = 'active',
      full_name = 'Operation Manager',
      updated_at = NOW();
    
    RAISE NOTICE 'Operation Management user created/updated successfully';
  ELSE
    RAISE NOTICE 'Auth user not found, skipping user creation';
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

-- Step 5: Final verification
SELECT 
  'Operation Management User Ready' as status,
  'You can now test with operation@udrive.ae / password123' as message;

-- Create Manual User RPC Function - Better Approach
-- Run this in your Supabase SQL Editor

-- 1. Create the RPC function for creating users with passwords
CREATE OR REPLACE FUNCTION create_manual_user(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT DEFAULT 'employee',
  user_status TEXT DEFAULT 'active'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  result_data JSON;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = user_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  END IF;

  -- Create user account in the database first
  INSERT INTO users (
    email,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    user_email,
    user_role,
    user_status,
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;

  -- Return success response with instructions
  result_data := json_build_object(
    'success', true,
    'data', json_build_object(
      'id', new_user_id,
      'email', user_email,
      'role', user_role,
      'status', user_status,
      'message', 'User created successfully. They need to use "Forgot Password" to set their initial password.'
    )
  );

  RETURN result_data;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 2. Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_manual_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. Test the function
-- SELECT create_manual_user('test@example.com', 'password123', 'admin', 'active');

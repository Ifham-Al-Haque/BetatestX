-- Invitation System for Existing Database Schema
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the existing invitations table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- 2. Update the invitations table to ensure it has all required fields
-- Add missing columns if they don't exist
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Drop any existing invite_user functions to avoid conflicts
DROP FUNCTION IF EXISTS invite_user(character varying, character varying, uuid);
DROP FUNCTION IF EXISTS invite_user(text, text, text, text, uuid);

-- 4. Create the invite_user RPC function that works with your existing table
CREATE OR REPLACE FUNCTION invite_user(
  invite_email TEXT,
  invite_role TEXT DEFAULT 'employee',
  invite_department TEXT DEFAULT 'Unassigned',
  invite_position TEXT DEFAULT 'Employee',
  inviter_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
  invitation_id INTEGER;
BEGIN
  -- Generate a unique token (using character varying as per your schema)
  new_token := 'inv_' || gen_random_uuid()::text;
  
  -- Insert the invitation using your existing table structure
  INSERT INTO invitations (
    email,
    role,
    department,
    "position",
    token,
    status,
    inviter_id,
    created_at,
    expires_at,
    invited_at,
    requested_at
  ) VALUES (
    invite_email,
    invite_role,
    invite_department,
    invite_position,
    new_token,
    'pending',
    inviter_id,
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  ) RETURNING id INTO invitation_id;
  
  -- Return success with token
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', invitation_id,
      'email', invite_email,
      'role', invite_role,
      'department', invite_department,
      'position', invite_position,
      'token', new_token,
      'expires_at', NOW() + INTERVAL '7 days'
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 5. Create the get_invitation_by_token RPC function
CREATE OR REPLACE FUNCTION get_invitation_by_token(
  invitation_token TEXT
)
RETURNS TABLE (
  id INTEGER,
  email CHARACTER VARYING,
  role CHARACTER VARYING,
  department CHARACTER VARYING,
  "position" CHARACTER VARYING,
  token CHARACTER VARYING,
  status CHARACTER VARYING,
  inviter_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  invited_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.role,
    i.department,
    i."position",
    i.token,
    i.status,
    i.inviter_id,
    i.created_at,
    i.expires_at,
    i.invited_at,
    i.requested_at
  FROM invitations i
  WHERE i.token = invitation_token
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$;

-- 6. Create the accept_invitation RPC function
CREATE OR REPLACE FUNCTION accept_invitation(
  invitation_token TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_phone TEXT DEFAULT NULL,
  user_location TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_data RECORD;
  new_user_id UUID;
  new_employee_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_data
  FROM invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Create user account
  INSERT INTO users (
    email,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    invitation_data.email,
    invitation_data.role,
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;
  
  -- Create employee record
  INSERT INTO employees (
    id,
    full_name,
    email,
    role,
    status,
    department,
    "position",
    phone,
    location,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_full_name,
    invitation_data.email,
    invitation_data.role,
    'active',
    COALESCE(invitation_data.department, 'Unassigned'),
    COALESCE(invitation_data."position", 'Employee'),
    user_phone,
    user_location,
    NOW(),
    NOW()
  ) RETURNING id INTO new_employee_id;
  
  -- Update user with employee_id
  UPDATE users 
  SET employee_id = new_employee_id
  WHERE id = new_user_id;
  
  -- Mark invitation as accepted
  UPDATE invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = new_user_id
  WHERE token = invitation_token;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'user_id', new_user_id,
      'employee_id', new_employee_id,
      'email', invitation_data.email,
      'role', invitation_data.role,
      'department', invitation_data.department,
      'position', invitation_data."position"
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback any changes
    ROLLBACK;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 7. Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION invite_user(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 8. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;

-- 9. Test the system
SELECT 'Invitation system created successfully for existing schema!' as status;

-- Test the invite_user function
-- SELECT invite_user('test@example.com', 'employee', 'IT', 'Developer');

-- Check if the functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('invite_user', 'get_invitation_by_token', 'accept_invitation');

-- Check the invitations table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

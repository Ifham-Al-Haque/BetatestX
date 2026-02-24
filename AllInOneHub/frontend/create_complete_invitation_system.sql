-- Complete Invitation System Setup for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create the access_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  department TEXT DEFAULT 'Unassigned',
  inviter_id UUID,
  notes TEXT
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_token ON access_requests(token);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_expires_at ON access_requests(expires_at);

-- 3. Enable RLS on the table
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for access_requests
CREATE POLICY "access_requests_select_policy" ON access_requests
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "access_requests_insert_policy" ON access_requests
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "access_requests_update_policy" ON access_requests
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "access_requests_delete_policy" ON access_requests
  FOR DELETE TO authenticated 
  USING (true);

-- 5. Create the invite_user RPC function
CREATE OR REPLACE FUNCTION invite_user(
  invite_email TEXT,
  invite_role TEXT DEFAULT 'employee',
  inviter_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  invitation_id UUID;
BEGIN
  -- Generate a unique token
  new_token := gen_random_uuid();
  
  -- Insert the invitation
  INSERT INTO access_requests (
    email,
    role,
    status,
    token,
    expires_at,
    invited_at,
    requested_at,
    inviter_id
  ) VALUES (
    invite_email,
    invite_role,
    'pending',
    new_token,
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW(),
    inviter_id
  ) RETURNING id INTO invitation_id;
  
  -- Return success with token
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', invitation_id,
      'email', invite_email,
      'role', invite_role,
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

-- 6. Create the get_invitation_by_token RPC function
CREATE OR REPLACE FUNCTION get_invitation_by_token(
  invitation_token UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  status TEXT,
  token UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  invited_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE,
  department TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.email,
    ar.role,
    ar.status,
    ar.token,
    ar.expires_at,
    ar.invited_at,
    ar.requested_at,
    ar.department
  FROM access_requests ar
  WHERE ar.token = invitation_token
    AND ar.status = 'pending'
    AND ar.expires_at > NOW();
END;
$$;

-- 7. Create the accept_invitation RPC function
CREATE OR REPLACE FUNCTION accept_invitation(
  invitation_token UUID,
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
  FROM access_requests
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
    full_name,
    phone,
    location
  ) VALUES (
    invitation_data.email,
    invitation_data.role,
    'active',
    user_full_name,
    user_phone,
    user_location
  ) RETURNING id INTO new_user_id;
  
  -- Create employee record
  INSERT INTO employees (
    id,
    full_name,
    email,
    role,
    status,
    department,
    position,
    phone,
    location
  ) VALUES (
    new_user_id,
    user_full_name,
    invitation_data.email,
    invitation_data.role,
    'active',
    COALESCE(invitation_data.department, 'Unassigned'),
    'Employee',
    user_phone,
    user_location
  ) RETURNING id INTO new_employee_id;
  
  -- Update user with employee_id
  UPDATE users 
  SET employee_id = new_employee_id
  WHERE id = new_user_id;
  
  -- Mark invitation as accepted
  UPDATE access_requests
  SET status = 'accepted'
  WHERE token = invitation_token;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'user_id', new_user_id,
      'employee_id', new_employee_id,
      'email', invitation_data.email,
      'role', invitation_data.role
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

-- 8. Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION invite_user(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 9. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON access_requests TO authenticated;
GRANT USAGE ON SEQUENCE access_requests_id_seq TO authenticated;

-- 10. Test the system
SELECT 'Complete invitation system created successfully!' as status;

-- Test the invite_user function
-- SELECT invite_user('test@example.com', 'employee');

-- Check if the table was created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'access_requests';

-- Check if the functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('invite_user', 'get_invitation_by_token', 'accept_invitation');

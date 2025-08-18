-- Quick Fix for Function Signature Conflict
-- Run this in your Supabase SQL Editor to resolve the invite_user function conflict

-- 1. Drop the conflicting functions
DROP FUNCTION IF EXISTS invite_user(character varying, character varying, uuid);
DROP FUNCTION IF EXISTS invite_user(text, text, text, text, uuid);

-- 2. Recreate the correct function
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION invite_user(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- 4. Test the function
SELECT 'Function conflict resolved!' as status;

-- 5. Test the function works
-- SELECT invite_user('test@example.com', 'employee', 'IT', 'Developer');

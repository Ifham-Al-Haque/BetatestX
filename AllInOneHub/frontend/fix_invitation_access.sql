-- Fix Invitation Access - Make invitation retrieval public
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_invitation_by_token(TEXT);

-- 2. Recreate the function with SECURITY DEFINER and public access
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

-- 3. Grant execute permission to everyone (including anonymous users)
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO authenticated;

-- 4. Also grant execute permission to the public role
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO public;

-- 5. Test the function
SELECT 'Invitation access fixed!' as status;

-- 6. Test the function works
SELECT * FROM get_invitation_by_token('inv_53aea873-70dd-4aaf-a2fe-b6022e2a564e');

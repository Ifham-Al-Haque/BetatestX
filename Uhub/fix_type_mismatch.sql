-- Fix the type mismatch in get_pending_invitations function
-- The function was declared to return TEXT but table columns are VARCHAR(255)

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_pending_invitations();

-- 2. Create the corrected get_pending_invitations function with matching types
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id INTEGER,
    email VARCHAR(255),
    role VARCHAR(50),
    department VARCHAR(100),
    "position" VARCHAR(100),
    token VARCHAR(255),
    status VARCHAR(20),
    inviter_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID,
    inviter_email VARCHAR(255)
) AS $$
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
        i.accepted_at,
        i.accepted_by,
        COALESCE(u.email, 'Unknown') as inviter_email
    FROM invitations i
    LEFT JOIN users u ON i.inviter_id = u.auth_user_id
    WHERE i.status = 'pending' 
    AND i.expires_at > NOW()
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;

-- 4. Test the function
SELECT 'Testing get_pending_invitations function...' as test;
SELECT * FROM get_pending_invitations();

-- 5. Verify the function exists and works
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'get_pending_invitations';

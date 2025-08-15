-- SIMPLE FIX - Run this in your Supabase SQL Editor
-- This will fix ALL your invitation problems

-- 1. Drop ALL conflicting functions
DROP FUNCTION IF EXISTS send_invitation(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS cancel_invitation(INTEGER, UUID);
DROP FUNCTION IF EXISTS cancel_invitation(UUID, UUID);
DROP FUNCTION IF EXISTS resend_invitation(INTEGER, UUID);
DROP FUNCTION IF EXISTS resend_invitation(UUID, UUID);
DROP FUNCTION IF EXISTS get_pending_invitations();
DROP FUNCTION IF EXISTS invite_user(TEXT, TEXT, UUID);

-- 2. Create the simple get_pending_invitations function
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id INTEGER,
    email TEXT,
    role TEXT,
    department TEXT,
    token TEXT,
    status TEXT,
    inviter_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID,
    inviter_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role,
        i.department,
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

-- 3. Create the simple invite_user function
CREATE OR REPLACE FUNCTION invite_user(
    invite_email TEXT,
    invite_role TEXT,
    inviter_id UUID
)
RETURNS JSON AS $$
DECLARE
    new_token TEXT;
    new_invitation_id INTEGER;
BEGIN
    -- Generate token
    new_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create invitation
    INSERT INTO invitations (
        email, role, department, token, status, expires_at, inviter_id, created_at
    )
    VALUES (
        invite_email, invite_role, 'Unassigned', 
        new_token, 'pending', NOW() + INTERVAL '7 days', inviter_id, NOW()
    )
    RETURNING id INTO new_invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'User invited successfully',
        'data', json_build_object(
            'invitation_id', new_invitation_id,
            'email', invite_email,
            'role', invite_role,
            'token', new_token,
            'expires_at', NOW() + INTERVAL '7 days'
        )
    );
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Failed to invite user: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION invite_user(TEXT, TEXT, UUID) TO authenticated;

-- 5. Test the functions
SELECT 'Testing get_pending_invitations...' as test;
SELECT * FROM get_pending_invitations();

SELECT 'Testing invite_user...' as test;
SELECT invite_user('test@example.com', 'employee', '00000000-0000-0000-0000-000000000000');

-- 6. Show what we created
SELECT 
    proname as function_name,
    proargtypes::regtype[] as parameter_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('get_pending_invitations', 'invite_user')
ORDER BY proname;

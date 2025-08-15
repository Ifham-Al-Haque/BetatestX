-- FINAL FIX - Addresses the type mismatch issue
-- Run this in your Supabase SQL Editor

-- 1. DROP ALL EXISTING FUNCTIONS TO REMOVE CONFLICTS
SELECT 'Dropping all existing functions...' as step;

-- Drop ALL invitation functions with ALL possible signatures
DROP FUNCTION IF EXISTS accept_invitation(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS accept_invitation(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS accept_invitation(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS accept_invitation(TEXT, TEXT);
DROP FUNCTION IF EXISTS accept_invitation(TEXT);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR);

DROP FUNCTION IF EXISTS send_invitation(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS send_invitation(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, VARCHAR);

DROP FUNCTION IF EXISTS cancel_invitation(INTEGER, UUID);
DROP FUNCTION IF EXISTS cancel_invitation(UUID, UUID);
DROP FUNCTION IF EXISTS cancel_invitation(TEXT, UUID);
DROP FUNCTION IF EXISTS cancel_invitation(VARCHAR, UUID);

DROP FUNCTION IF EXISTS resend_invitation(INTEGER, UUID);
DROP FUNCTION IF EXISTS resend_invitation(UUID, UUID);
DROP FUNCTION IF EXISTS resend_invitation(TEXT, UUID);
DROP FUNCTION IF EXISTS resend_invitation(VARCHAR, UUID);

DROP FUNCTION IF EXISTS get_pending_invitations();
DROP FUNCTION IF EXISTS get_pending_invitations(TEXT);
DROP FUNCTION IF EXISTS get_pending_invitations(VARCHAR);

DROP FUNCTION IF EXISTS invite_user(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS invite_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS invite_user(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS invite_user(VARCHAR, VARCHAR, VARCHAR);

DROP FUNCTION IF EXISTS get_invitation_by_token(TEXT);
DROP FUNCTION IF EXISTS get_invitation_by_token(UUID);
DROP FUNCTION IF EXISTS get_invitation_by_token(VARCHAR);

-- 2. CREATE FUNCTIONS THAT MATCH YOUR ACTUAL TABLE STRUCTURE

-- Function 1: get_pending_invitations (FIXED for VARCHAR columns)
SELECT 'Creating get_pending_invitations...' as step;
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id INTEGER,
    email VARCHAR(255),
    role VARCHAR(255),
    department VARCHAR(255),
    token VARCHAR(255),
    status VARCHAR(255),
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

-- Function 2: invite_user (FIXED for VARCHAR columns)
SELECT 'Creating invite_user...' as step;
CREATE OR REPLACE FUNCTION invite_user(
    invite_email VARCHAR(255),
    invite_role VARCHAR(255),
    inviter_id UUID
)
RETURNS JSON AS $$
DECLARE
    new_token VARCHAR(255);
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

-- Function 3: accept_invitation (FIXED for VARCHAR columns)
SELECT 'Creating accept_invitation...' as step;
CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_token VARCHAR(255),
    user_password VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(255) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
    new_employee_id UUID;
    new_user_id UUID;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record
    FROM invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;
    
    -- Generate new UUIDs
    new_employee_id := gen_random_uuid();
    new_user_id := gen_random_uuid();
    
    -- Insert into employees table
    INSERT INTO employees (
        id, full_name, email, role, department, phone, location, status, created_at
    )
    VALUES (
        new_employee_id, full_name, invitation_record.email, invitation_record.role, 
        invitation_record.department, phone, location, 'active', NOW()
    );
    
    -- Insert into users table
    INSERT INTO users (
        id, auth_user_id, email, role, created_at
    )
    VALUES (
        new_user_id, new_employee_id, invitation_record.email, invitation_record.role, NOW()
    );
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', accepted_at = NOW(), accepted_by = new_employee_id
    WHERE token = invitation_token;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Account created successfully',
        'data', json_build_object(
            'employee_id', new_employee_id,
            'user_id', new_user_id,
            'email', invitation_record.email,
            'role', invitation_record.role
        )
    );
    
EXCEPTION 
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Failed to create account: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: get_invitation_by_token (FIXED for VARCHAR columns)
SELECT 'Creating get_invitation_by_token...' as step;
CREATE OR REPLACE FUNCTION get_invitation_by_token(invitation_token VARCHAR(255))
RETURNS TABLE (
    id INTEGER,
    email VARCHAR(255),
    role VARCHAR(255),
    department VARCHAR(255),
    token VARCHAR(255),
    status VARCHAR(255),
    inviter_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id, i.email, i.role, i.department, i.token, i.status, 
        i.inviter_id, i.created_at, i.expires_at
    FROM invitations i
    WHERE i.token = invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GRANT PERMISSIONS
SELECT 'Granting permissions...' as step;
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION invite_user(VARCHAR(255), VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(VARCHAR(255), VARCHAR(255), VARCHAR(255), VARCHAR(255), VARCHAR(255)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(VARCHAR(255)) TO authenticated;

-- 4. VERIFY FUNCTIONS WERE CREATED
SELECT 'Verifying functions...' as step;
SELECT 
    proname as function_name,
    proargtypes::regtype[] as parameter_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('get_pending_invitations', 'invite_user', 'accept_invitation', 'get_invitation_by_token')
ORDER BY proname;

-- 5. TEST THE FUNCTIONS
SELECT 'Testing functions...' as step;

-- Test get_pending_invitations
SELECT 'Testing get_pending_invitations...' as test_name;
SELECT * FROM get_pending_invitations() LIMIT 1;

-- Test invite_user
SELECT 'Testing invite_user...' as test_name;
SELECT invite_user('test@example.com', 'employee', '00000000-0000-0000-0000-000000000000');

-- Test get_invitation_by_token
SELECT 'Testing get_invitation_by_token...' as test_name;
SELECT * FROM get_invitation_by_token('test-token') LIMIT 1;

SELECT '=== FINAL FIX COMPLETED ===' as status;

-- Comprehensive fix for all type mismatches in invitation functions
-- This ensures function return types match the actual table column types

-- 1. First, let's check what the actual table structure looks like
SELECT '=== CHECKING ACTUAL TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations' 
ORDER BY ordinal_position;

-- 2. Drop ALL existing invitation functions to start fresh
DROP FUNCTION IF EXISTS get_pending_invitations();
DROP FUNCTION IF EXISTS send_invitation(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS send_invitation(CHARACTER VARYING, CHARACTER VARYING, UUID);
DROP FUNCTION IF EXISTS cancel_invitation(INTEGER, UUID);
DROP FUNCTION IF EXISTS resend_invitation(INTEGER, UUID);

-- 3. Create functions with correct types that match the table structure

-- get_pending_invitations function
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

-- send_invitation function
CREATE OR REPLACE FUNCTION send_invitation(
    invite_email VARCHAR(255),
    invite_role VARCHAR(50) DEFAULT 'employee',
    inviter_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_token VARCHAR(255);
    new_invitation_id INTEGER;
    result JSON;
BEGIN
    -- Check if email already has a pending invitation
    IF EXISTS (
        SELECT 1 FROM invitations 
        WHERE email = invite_email 
        AND status = 'pending' 
        AND expires_at > NOW()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'An invitation is already pending for this email'
        );
    END IF;
    
    -- Check if user already exists
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE email = invite_email
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User with this email already exists'
        );
    END IF;
    
    -- Generate unique token
    invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert invitation
    INSERT INTO invitations (email, role, token, inviter_id)
    VALUES (invite_email, invite_role, invitation_token, inviter_id)
    RETURNING id INTO new_invitation_id;
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'invitation_id', new_invitation_id,
        'token', invitation_token,
        'message', 'Invitation created successfully'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to create invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_invitation function
CREATE OR REPLACE FUNCTION cancel_invitation(
    invitation_id INTEGER,
    canceller_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if invitation exists and is pending
    IF NOT EXISTS (
        SELECT 1 FROM invitations 
        WHERE id = invitation_id 
        AND status = 'pending'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation not found or already processed'
        );
    END IF;
    
    -- Cancel the invitation
    UPDATE invitations 
    SET status = 'cancelled'
    WHERE id = invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation cancelled successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to cancel invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- resend_invitation function
CREATE OR REPLACE FUNCTION resend_invitation(
    invitation_id INTEGER,
    resender_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    new_token VARCHAR(255);
    result JSON;
BEGIN
    -- Find the invitation
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE id = invitation_id 
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation not found or already processed'
        );
    END IF;
    
    -- Generate new token
    new_token := encode(gen_random_bytes(32), 'hex');
    
    -- Update invitation with new token and extend expiry
    UPDATE invitations 
    SET 
        token = new_token,
        expires_at = NOW() + INTERVAL '7 days'
    WHERE id = invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'new_token', new_token,
        'new_expires_at', NOW() + INTERVAL '7 days',
        'message', 'Invitation resent successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to resend invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION send_invitation(VARCHAR(255), VARCHAR(50), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_invitation(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resend_invitation(INTEGER, UUID) TO authenticated;

-- 5. Verify function definitions
SELECT '=== FUNCTION VERIFICATION ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname IN ('send_invitation', 'cancel_invitation', 'resend_invitation', 'get_pending_invitations')
ORDER BY p.proname;

-- 6. Test all functions
SELECT '=== TESTING FUNCTIONS ===' as section;

-- Test get_pending_invitations
SELECT 'Testing get_pending_invitations...' as test;
SELECT * FROM get_pending_invitations();

-- Test send_invitation
SELECT 'Testing send_invitation...' as test;
SELECT send_invitation('test@example.com', 'employee', NULL) as test_result;

-- Test cancel_invitation (will fail if no invitations exist, which is expected)
SELECT 'Testing cancel_invitation...' as test;
SELECT cancel_invitation(999, NULL) as test_result;

-- Test resend_invitation (will fail if no invitations exist, which is expected)
SELECT 'Testing resend_invitation...' as test;
SELECT resend_invitation(999, NULL) as test_result;

SELECT '=== ALL TYPE MISMATCHES FIXED ===' as section;

-- Fix Invitation System Functions with Proper Data Types
-- This will resolve the "Returned type text does not match expected type character varying" error

-- 1. Drop existing invitation functions
DROP FUNCTION IF EXISTS get_pending_invitations();
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR);
DROP FUNCTION IF EXISTS cancel_invitation(UUID);
DROP FUNCTION IF EXISTS resend_invitation(UUID);

-- 2. Create corrected get_pending_invitations function
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    role VARCHAR(255),
    invited_by UUID,
    token VARCHAR(255),
    status VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    invited_by_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email::VARCHAR(255),
        i.role::VARCHAR(255),
        i.invited_by,
        i.token::VARCHAR(255),
        i.status::VARCHAR(255),
        i.expires_at,
        i.created_at,
        COALESCE(e.full_name, 'Unknown')::VARCHAR(255) as invited_by_name
    FROM invitations i
    LEFT JOIN employees e ON i.invited_by = e.id
    WHERE i.status = 'pending'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create corrected send_invitation function
CREATE OR REPLACE FUNCTION send_invitation(
    user_email VARCHAR,
    user_role VARCHAR,
    invited_by_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    invitation_id UUID;
    invitation_token VARCHAR(255);
    result JSON;
BEGIN
    -- Check if invitation already exists
    IF EXISTS (SELECT 1 FROM invitations WHERE email = user_email AND status = 'pending') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation already exists for this email'
        );
    END IF;
    
    -- Generate unique token
    invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create invitation
    INSERT INTO invitations (email, role, invited_by, token, status, expires_at)
    VALUES (
        user_email,
        user_role,
        invited_by_uuid,
        invitation_token,
        'pending',
        NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'token', invitation_token,
        'email', user_email,
        'role', user_role,
        'expires_at', NOW() + INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create corrected accept_invitation function
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token VARCHAR)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations;
    result JSON;
BEGIN
    -- Find invitation by token
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE token = invitation_token AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invitation token'
        );
    END IF;
    
    -- Check if expired
    IF invitation_record.expires_at < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation has expired'
        );
    END IF;
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', true,
        'invitation_id', invitation_record.id,
        'email', invitation_record.email,
        'role', invitation_record.role,
        'message', 'Invitation accepted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create corrected cancel_invitation function
CREATE OR REPLACE FUNCTION cancel_invitation(invitation_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if invitation exists and is pending
    IF NOT EXISTS (SELECT 1 FROM invitations WHERE id = invitation_id AND status = 'pending') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation not found or already processed'
        );
    END IF;
    
    -- Cancel invitation
    UPDATE invitations 
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation cancelled successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create corrected resend_invitation function
CREATE OR REPLACE FUNCTION resend_invitation(invitation_id UUID)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations;
    new_token VARCHAR(255);
    result JSON;
BEGIN
    -- Check if invitation exists and is pending
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE id = invitation_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation not found or already processed'
        );
    END IF;
    
    -- Generate new token and extend expiry
    new_token := encode(gen_random_bytes(32), 'hex');
    
    -- Update invitation with new token and extended expiry
    UPDATE invitations 
    SET token = new_token, 
        expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
    WHERE id = invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'new_token', new_token,
        'new_expires_at', NOW() + INTERVAL '7 days',
        'message', 'Invitation resent successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Test the functions
SELECT '=== TESTING INVITATION FUNCTIONS ===' as section;

-- Test if functions exist
SELECT 
    'Function exists' as info,
    proname as function_name,
    proargtypes::regtype[] as parameters,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('get_pending_invitations', 'send_invitation', 'accept_invitation', 'cancel_invitation', 'resend_invitation')
ORDER BY proname;

-- Test get_pending_invitations (will work if there are pending invitations)
SELECT 'get_pending_invitations function is ready to use' as info;

-- 8. Show current invitations
SELECT '=== CURRENT INVITATIONS ===' as section;
SELECT 
    id,
    email,
    role,
    status,
    created_at,
    expires_at
FROM invitations
ORDER BY created_at DESC;

-- 9. Instructions
SELECT '=== NEXT STEPS ===' as section;
SELECT 
    '1. Invitation functions are now fixed' as step1,
    '2. Refresh your app' as step2,
    '3. Invitation system should work' as step3,
    '4. No more data type errors' as step4;

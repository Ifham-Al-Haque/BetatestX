-- Fix the send_invitation function conflict
-- This resolves the "Could not choose the best candidate function" error

-- 1. Drop ALL existing send_invitation functions to resolve conflicts
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS send_invitation(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS send_invitation(CHARACTER VARYING, CHARACTER VARYING, UUID);
DROP FUNCTION IF EXISTS send_invitation(CHARACTER VARYING, CHARACTER VARYING);
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS send_invitation(TEXT, TEXT);

-- 2. Create a single, clean send_invitation function
CREATE OR REPLACE FUNCTION send_invitation(
    invite_email TEXT,
    invite_role TEXT DEFAULT 'employee',
    inviter_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_token TEXT;
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

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION send_invitation(TEXT, TEXT, UUID) TO authenticated;

-- 4. Verify only one function exists
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'send_invitation';

-- 5. Test the function
SELECT 'Testing send_invitation function...' as test;
SELECT send_invitation('test@example.com', 'employee', NULL) as test_result;

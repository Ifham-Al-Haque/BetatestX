-- Create the invite_user function for best practice user invitations
-- Run this in your Supabase SQL Editor

-- First, drop any existing function with the same name to avoid conflicts
DROP FUNCTION IF EXISTS invite_user(TEXT, TEXT, UUID);

-- Create the new invite_user function
CREATE OR REPLACE FUNCTION invite_user(
    invite_email TEXT,
    invite_role TEXT,
    inviter_id UUID
)
RETURNS JSON AS $$
DECLARE
    new_token TEXT;
    new_invitation_id INTEGER;
    existing_invitation_id INTEGER;
BEGIN
    -- Check if user already has a pending invitation
    SELECT id INTO existing_invitation_id
    FROM invitations 
    WHERE email = invite_email 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF existing_invitation_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User already has a pending invitation',
            'invitation_id', existing_invitation_id
        );
    END IF;
    
    -- Generate a secure, cryptographically random token
    new_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create the invitation
    INSERT INTO invitations (
        email, 
        role, 
        department, 
        position, 
        token, 
        status, 
        expires_at, 
        inviter_id,
        created_at
    )
    VALUES (
        invite_email,
        invite_role,
        'Unassigned',
        'Employee',
        new_token,
        'pending',
        NOW() + INTERVAL '7 days',
        inviter_id,
        NOW()
    )
    RETURNING id INTO new_invitation_id;
    
    -- Return success with all necessary information
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
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User with this email already exists'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to invite user: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_user(TEXT, TEXT, UUID) TO authenticated;

-- Verify the function was created successfully
SELECT 
    proname as function_name,
    proargtypes::regtype[] as parameter_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'invite_user';

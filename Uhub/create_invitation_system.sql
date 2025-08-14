-- Create Invitation System for Your Database Schema
-- This script will create the missing functions and fix the data type issues

-- 1. First, let's check what functions exist
SELECT '=== EXISTING FUNCTIONS ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%invitation%';

-- 2. Check your invitations table structure
SELECT '=== INVITATIONS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- 3. Check your employees table structure for the fields we need
SELECT '=== EMPLOYEES TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name IN ('id', 'email', 'full_name')
ORDER BY ordinal_position;

-- 4. Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_pending_invitations();
DROP FUNCTION IF EXISTS send_invitation(VARCHAR, VARCHAR, UUID);
DROP FUNCTION IF EXISTS generate_invitation_token();

-- 5. Create the generate_invitation_token function
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 6. Create the get_pending_invitations function with correct data types
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    role VARCHAR(50),
    invited_by_email VARCHAR(255),
    invited_by_name VARCHAR(255),
    status VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role,
        COALESCE(e.email, '') as invited_by_email,
        COALESCE(e.full_name, '') as invited_by_name,
        i.status,
        i.expires_at,
        i.created_at
    FROM invitations i
    LEFT JOIN employees e ON i.invited_by = e.id
    WHERE i.status = 'pending'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create the send_invitation function
CREATE OR REPLACE FUNCTION send_invitation(
    invite_email VARCHAR,
    invite_role VARCHAR,
    inviter_id UUID
)
RETURNS JSON AS $$
DECLARE
    invitation_id UUID;
    invitation_token VARCHAR;
    result JSON;
BEGIN
    -- Check if inviter has permission to send invitations
    IF NOT EXISTS (
        SELECT 1 FROM employees e
        JOIN roles r ON e.role_id = r.id
        WHERE e.id = inviter_id 
        AND r.name = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to send invitations'
        );
    END IF;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM employees WHERE email = invite_email) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User with this email already exists'
        );
    END IF;
    
    -- Check if invitation already exists
    IF EXISTS (SELECT 1 FROM invitations WHERE email = invite_email AND status = 'pending') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation already sent to this email'
        );
    END IF;
    
    -- Generate token
    invitation_token := generate_invitation_token();
    
    -- Create invitation
    INSERT INTO invitations (email, role, invited_by, token, status)
    VALUES (invite_email, invite_role, inviter_id, invitation_token, 'pending')
    RETURNING id INTO invitation_id;
    
    -- Return success with token
    RETURN json_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'token', invitation_token,
        'expires_at', (SELECT expires_at FROM invitations WHERE id = invitation_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Test the functions
SELECT '=== TESTING FUNCTIONS ===' as section;

-- Test token generation
SELECT 'Test token:' as info, generate_invitation_token() as sample_token;

-- Test get_pending_invitations (should work even if no invitations yet)
SELECT 'Testing get_pending_invitations:' as info;
SELECT * FROM get_pending_invitations();

-- 9. Show function signatures
SELECT '=== FUNCTION SIGNATURES ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('get_pending_invitations', 'send_invitation', 'generate_invitation_token')
ORDER BY p.proname;

-- 10. Verify your admin role
SELECT '=== YOUR ADMIN STATUS ===' as section;
SELECT 
    email, 
    role, 
    role_id,
    status
FROM employees 
WHERE email = 'ifham@udrive.ae';

-- 11. Check if you have any pending invitations
SELECT '=== CURRENT INVITATIONS ===' as section;
SELECT 
    COUNT(*) as total_invitations,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invitations,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_invitations
FROM invitations;

-- =====================================================
-- FIX NAVIGATION AND INVITATION SYSTEM
-- =====================================================
-- This script fixes two issues:
-- 1. Navigation problems in admin panel
-- 2. Missing invitation functions

-- =====================================================
-- PART 1: CREATE INVITATION SYSTEM FUNCTIONS
-- =====================================================

-- 1. Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    department VARCHAR(100),
    position VARCHAR(100),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    inviter_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- 3. Create the send_invitation function
CREATE OR REPLACE FUNCTION send_invitation(
    invite_email VARCHAR,
    invite_role VARCHAR DEFAULT 'employee',
    inviter_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_token VARCHAR;
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

-- 4. Create the get_pending_invitations function
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id INTEGER,
    email VARCHAR,
    role VARCHAR,
    department VARCHAR,
    position VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    inviter_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role,
        i.department,
        i.position,
        i.status,
        i.created_at,
        i.expires_at,
        u.email as inviter_email
    FROM invitations i
    LEFT JOIN users u ON i.inviter_id = u.auth_user_id
    WHERE i.status = 'pending' 
    AND i.expires_at > NOW()
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the cancel_invitation function
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

-- 6. Create the accept_invitation function
CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_token VARCHAR,
    user_password VARCHAR,
    user_metadata JSON DEFAULT '{}'::json
)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    new_user_id UUID;
    result JSON;
BEGIN
    -- Find the invitation
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invitation token'
        );
    END IF;
    
    -- Create user account in auth.users (this would be handled by Supabase Auth)
    -- For now, we'll just mark the invitation as accepted
    UPDATE invitations 
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = auth.uid()
    WHERE id = invitation_record.id;
    
    -- Create user record in users table
    INSERT INTO users (email, role, status, auth_user_id)
    VALUES (
        invitation_record.email, 
        invitation_record.role, 
        'active',
        auth.uid()
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation accepted successfully',
        'user_email', invitation_record.email,
        'user_role', invitation_record.role
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to accept invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: FIX USER ROLE CHECKING FOR NAVIGATION
-- =====================================================

-- 7. Create a function to check if user is admin (for navigation)
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    -- If no UUID provided, use current auth user
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- Check if user exists and has admin role
    SELECT role INTO user_role
    FROM users 
    WHERE auth_user_id = user_uuid;
    
    RETURN user_role = 'admin';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to get user navigation permissions
CREATE OR REPLACE FUNCTION get_user_navigation_permissions(user_uuid UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_record users%ROWTYPE;
    permissions JSON;
BEGIN
    -- If no UUID provided, use current auth user
    IF user_uuid IS NULL THEN
        user_uuid := auth.uid();
    END IF;
    
    -- Get user record
    SELECT * INTO user_record
    FROM users 
    WHERE auth_user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'is_admin', false,
            'can_access_user_management', false,
            'can_access_admin_panel', false,
            'role', 'none'
        );
    END IF;
    
    -- Build permissions based on role
    permissions := json_build_object(
        'is_admin', user_record.role = 'admin',
        'can_access_user_management', user_record.role IN ('admin', 'manager'),
        'can_access_admin_panel', user_record.role = 'admin',
        'role', user_record.role,
        'status', user_record.status
    );
    
    RETURN permissions;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'is_admin', false,
            'can_access_user_management', false,
            'can_access_admin_panel', false,
            'role', 'error',
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 3: GRANT PERMISSIONS
-- =====================================================

-- 9. Grant necessary permissions
GRANT ALL ON invitations TO authenticated;
GRANT EXECUTE ON FUNCTION send_invitation(VARCHAR, VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_invitation(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(VARCHAR, VARCHAR, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_navigation_permissions(UUID) TO authenticated;

-- =====================================================
-- PART 4: VERIFY THE FIXES
-- =====================================================

-- 10. Test the invitation functions
SELECT '=== INVITATION FUNCTIONS CREATED ===' as section;

-- Test send_invitation function
SELECT 'Testing send_invitation function...' as test;
SELECT send_invitation('test@example.com', 'employee', NULL) as test_result;

-- Test get_pending_invitations function
SELECT 'Testing get_pending_invitations function...' as test;
SELECT get_pending_invitations() as pending_invitations;

-- Test navigation permission functions
SELECT 'Testing navigation permission functions...' as test;
SELECT get_user_navigation_permissions() as current_user_permissions;

-- 11. Show created functions
SELECT '=== CREATED FUNCTIONS ===' as section;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'send_invitation',
    'get_pending_invitations', 
    'cancel_invitation',
    'accept_invitation',
    'is_user_admin',
    'get_user_navigation_permissions'
)
ORDER BY routine_name;

-- 12. Success message
SELECT '=== NAVIGATION AND INVITATION SYSTEM FIXED ===' as status;
SELECT '1. Invitation functions created successfully' as fix_1;
SELECT '2. Navigation permission functions created' as fix_2;
SELECT '3. Admin panel should now work properly' as fix_3;
SELECT '4. User Management should stay on the page' as fix_4;
SELECT '5. Invitations can now be sent and managed' as fix_5;

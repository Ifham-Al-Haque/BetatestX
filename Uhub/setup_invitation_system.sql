-- Setup Invitation System for User Registration
-- This system allows admins to invite users who then set up their own passwords

-- 1. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    invited_by UUID REFERENCES employees(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create invitation_roles table for role-specific invitations
CREATE TABLE IF NOT EXISTS invitation_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default invitation roles
INSERT INTO invitation_roles (role_name, display_name, description, permissions) VALUES
    ('admin', 'Administrator', 'Full system access with user management capabilities', 
     '{"all_sections": true, "user_management": true, "role_management": true}'),
    ('manager', 'Manager', 'Department management with elevated permissions', 
     '{"drivers": ["view", "create", "edit"], "employees": ["view", "edit"], "user_management": false}'),
    ('driver_management', 'Driver Management', 'Access only to driver-related pages', 
     '{"drivers": ["view", "create", "edit"], "driver_records": ["view", "create", "edit"]}'),
    ('employee', 'Employee', 'Standard user access', 
     '{"dashboard": ["view"], "drivers": ["view"], "personal_data": ["view", "edit"]}'),
    ('view', 'Viewer', 'Read-only access for testing', 
     '{"dashboard": ["view"], "other_pages": ["view"]}')
ON CONFLICT (role_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;

-- 4. Create function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to send invitation
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

-- 6. Create function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_token VARCHAR,
    user_password VARCHAR,
    full_name VARCHAR,
    phone VARCHAR DEFAULT NULL,
    location VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
    new_user_id UUID;
    result JSON;
BEGIN
    -- Find invitation
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
    
    -- Create new user in employees table
    INSERT INTO employees (
        email, 
        full_name, 
        role, 
        phone, 
        location, 
        status,
        role_id
    ) VALUES (
        invitation_record.email,
        full_name,
        invitation_record.role,
        phone,
        location,
        'active',
        (SELECT id FROM roles WHERE name = invitation_record.role)
    ) RETURNING id INTO new_user_id;
    
    -- Update invitation status
    UPDATE invitations 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', invitation_record.email,
        'role', invitation_record.role,
        'message', 'User account created successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get pending invitations
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    role VARCHAR,
    invited_by_email VARCHAR,
    invited_by_name VARCHAR,
    status VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role,
        e.email as invited_by_email,
        e.full_name as invited_by_name,
        i.status,
        i.expires_at,
        i.created_at
    FROM invitations i
    LEFT JOIN employees e ON i.invited_by = e.id
    WHERE i.status = 'pending'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to cancel invitation
CREATE OR REPLACE FUNCTION cancel_invitation(
    invitation_id UUID,
    canceller_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if canceller has permission
    IF NOT EXISTS (
        SELECT 1 FROM employees e
        JOIN roles r ON e.role_id = r.id
        WHERE e.id = canceller_id 
        AND r.name = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to cancel invitations'
        );
    END IF;
    
    -- Cancel invitation
    UPDATE invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE id = invitation_id 
    AND status = 'pending';
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Invitation cancelled successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation not found or already processed'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to resend invitation
CREATE OR REPLACE FUNCTION resend_invitation(
    invitation_id UUID,
    resender_id UUID
)
RETURNS JSON AS $$
DECLARE
    new_token VARCHAR;
    result JSON;
BEGIN
    -- Check if resender has permission
    IF NOT EXISTS (
        SELECT 1 FROM employees e
        JOIN roles r ON e.role_id = r.id
        WHERE e.id = resender_id 
        AND r.name = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions to resend invitations'
        );
    END IF;
    
    -- Generate new token
    new_token := generate_invitation_token();
    
    -- Update invitation with new token and extend expiry
    UPDATE invitations 
    SET 
        token = new_token,
        expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
    WHERE id = invitation_id 
    AND status = 'pending';
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'new_token', new_token,
            'new_expires_at', NOW() + INTERVAL '7 days',
            'message', 'Invitation resent successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Invitation not found or already processed'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- 11. Create RLS policies for invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations" ON invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- Admins can update invitations
CREATE POLICY "Admins can update invitations" ON invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- Anyone can view invitation by token (for acceptance)
CREATE POLICY "Anyone can view invitation by token" ON invitations
    FOR SELECT USING (
        token IS NOT NULL
    );

-- 12. Insert sample invitation (optional - for testing)
-- INSERT INTO invitations (email, role, invited_by, token, status) VALUES
--     ('test@example.com', 'employee', (SELECT id FROM employees WHERE email = 'ifham@udrive.ae'), generate_invitation_token(), 'pending');

-- 13. Final verification
SELECT '=== INVITATION SYSTEM SETUP COMPLETE ===' as section;

SELECT 'Tables created:' as info, 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('invitations', 'invitation_roles')) as tables_count;

SELECT 'Functions created:' as info,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('send_invitation', 'accept_invitation', 'get_pending_invitations', 'cancel_invitation', 'resend_invitation')) as functions_count;

SELECT 'Invitation roles available:' as info, role_name, display_name FROM invitation_roles WHERE is_active = true ORDER BY role_name;

SELECT 'Sample invitation token:' as info, generate_invitation_token() as sample_token; 
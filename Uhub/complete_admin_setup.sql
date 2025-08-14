-- Complete Admin System Setup
-- This script will set up the complete admin system and fix role issues

-- 1. First, let's check your current status
SELECT '=== CURRENT USER STATUS ===' as section;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM employees 
WHERE email = 'ifham@udrive.ae';

-- 2. Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    access_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert the specific roles requested
INSERT INTO roles (name, description, permissions, access_level) VALUES
    ('admin', 'Full system administrator with complete access to all sections', 
     '{
       "dashboard": ["view", "edit", "delete"],
       "employees": ["view", "create", "edit", "delete"],
       "drivers": ["view", "create", "edit", "delete"],
       "assets": ["view", "create", "edit", "delete"],
       "expenses": ["view", "create", "edit", "delete"],
       "simcards": ["view", "create", "edit", "delete"],
       "vouchers": ["view", "create", "edit", "delete"],
       "tickets": ["view", "create", "edit", "delete"],
       "calendar": ["view", "edit"],
       "attendance": ["view", "edit"],
       "analytics": ["view", "edit"],
       "user_management": true,
       "role_management": true,
       "system_settings": true
     }', 1),
     
    ('manager', 'Semi-admin with elevated permissions but no user management', 
     '{
       "dashboard": ["view", "edit"],
       "employees": ["view", "edit"],
       "drivers": ["view", "create", "edit"],
       "assets": ["view", "create", "edit"],
       "expenses": ["view", "create", "edit"],
       "simcards": ["view", "create", "edit"],
       "vouchers": ["view", "create", "edit"],
       "tickets": ["view", "create", "edit"],
       "calendar": ["view", "edit"],
       "attendance": ["view", "edit"],
       "analytics": ["view"],
       "user_management": false,
       "role_management": false,
       "system_settings": false
     }', 2),
     
    ('driver_management', 'Driver-specific role with access only to driver-related pages', 
     '{
       "dashboard": ["view"],
       "drivers": ["view", "create", "edit"],
       "driver_records": ["view", "create", "edit"],
       "driver_documents": ["view", "upload", "edit"],
       "other_pages": ["view"]
     }', 3),
     
    ('employee', 'Standard user access', 
     '{
       "dashboard": ["view"],
       "drivers": ["view"],
       "personal_data": ["view", "edit"]
     }', 4),
     
    ('view', 'Read-only access to dashboard only for testing purposes', 
     '{
       "dashboard": ["view"],
       "other_pages": ["view"]
     }', 5)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    access_level = EXCLUDED.access_level,
    updated_at = NOW();

-- 4. Add role_id column to employees table if it doesn't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

-- 5. Update existing employees to use the new role system
UPDATE employees 
SET role_id = (SELECT id FROM roles WHERE name = employees.role)
WHERE role_id IS NULL AND role IS NOT NULL;

-- 6. CRITICAL: Assign admin role to ifham@udrive.ae
UPDATE employees 
SET role = 'admin', 
    role_id = (SELECT id FROM roles WHERE name = 'admin'),
    status = 'active'
WHERE email = 'ifham@udrive.ae';

-- 7. Create invitations table for the invitation system
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

-- 8. Create invitation_roles table
CREATE TABLE IF NOT EXISTS invitation_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Insert default invitation roles
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

-- 10. Create invitation system functions
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

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

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- 12. Create RLS policies for invitations table
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

-- 13. Final verification
SELECT '=== ADMIN SYSTEM SETUP COMPLETE ===' as section;

SELECT 'Your admin status:' as info, 
    email, 
    role, 
    role_id,
    status
FROM employees 
WHERE email = 'ifham@udrive.ae';

SELECT 'Available roles:' as info, name, description, access_level 
FROM roles 
ORDER BY access_level;

SELECT 'Invitation system ready:' as info,
    (SELECT COUNT(*) FROM invitations) as total_invitations,
    (SELECT COUNT(*) FROM invitation_roles) as available_roles;

-- 14. Test invitation system
SELECT 'Test invitation token:' as info, generate_invitation_token() as sample_token;

-- 15. Show admin navigation items
SELECT 'Admin navigation items:' as info,
    'User Management' as item1,
    'Access Requests' as item2,
    'Analytics' as item3,
    'Role Management' as item4;

-- Role Management Setup Script
-- This script sets up proper role management and fixes the current user's role

-- 1. First, let's check what roles currently exist
SELECT DISTINCT role FROM employees ORDER BY role;

-- 2. Create a roles table for better role management (if it doesn't exist)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default roles if they don't exist
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'Full system administrator with all permissions', 
     '{"drivers": ["create", "read", "update", "delete"], "employees": ["create", "read", "update", "delete"], "user_management": true}'),
    ('manager', 'Department manager with elevated permissions', 
     '{"drivers": ["create", "read", "update"], "employees": ["read", "update"], "user_management": false}'),
    ('employee', 'Regular employee with basic permissions', 
     '{"drivers": ["read"], "employees": ["read"], "user_management": false}'),
    ('viewer', 'Read-only user with minimal permissions', 
     '{"drivers": ["read"], "employees": ["read"], "user_management": false}')
ON CONFLICT (name) DO NOTHING;

-- 4. Add role_id column to employees table if it doesn't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

-- 5. Update existing employees to use the new role system
UPDATE employees 
SET role_id = (SELECT id FROM roles WHERE name = employees.role)
WHERE role_id IS NULL AND role IS NOT NULL;

-- 6. Find the current user (you'll need to replace 'your-email@example.com' with actual email)
-- First, let's see what users exist:
SELECT id, email, full_name, role, role_id FROM employees ORDER BY created_at DESC LIMIT 10;

-- 7. Assign admin role to the current user (replace the email with your actual email)
-- Option A: If you know your email, uncomment and modify this line:
-- UPDATE employees SET role = 'admin', role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE email = 'your-email@example.com';

-- Option B: Assign admin role to the most recent user (usually the first user created):
UPDATE employees 
SET role = 'admin', role_id = (SELECT id FROM roles WHERE name = 'admin') 
WHERE id = (SELECT id FROM employees ORDER BY created_at ASC LIMIT 1);

-- 8. Verify the role assignment
SELECT id, email, full_name, role, role_id FROM employees WHERE role = 'admin';

-- 9. Update RLS policies to use the new role system
-- Drop existing policies
DROP POLICY IF EXISTS "Admins and managers can insert driver records" ON drivers;
DROP POLICY IF EXISTS "Admins and managers can update driver records" ON drivers;
DROP POLICY IF EXISTS "Admins and managers can delete driver records" ON drivers;
DROP POLICY IF EXISTS "Users can view driver records" ON drivers;

-- Create new policies using the roles table
CREATE POLICY "Role-based driver access" ON drivers
    FOR ALL USING (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name IN ('admin', 'manager', 'employee')
        )
    );

CREATE POLICY "Role-based driver insert" ON drivers
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name IN ('admin', 'manager')
        )
    );

CREATE POLICY "Role-based driver update" ON drivers
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name IN ('admin', 'manager')
        )
    );

CREATE POLICY "Role-based driver delete" ON drivers
    FOR DELETE USING (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name = 'admin'
        )
    );

-- 10. Update driver_documents policies as well
DROP POLICY IF EXISTS "Role-based driver documents access" ON driver_documents;
DROP POLICY IF EXISTS "Role-based driver documents insert" ON driver_documents;
DROP POLICY IF EXISTS "Role-based driver documents update" ON driver_documents;
DROP POLICY IF EXISTS "Role-based driver documents delete" ON driver_documents;

CREATE POLICY "Role-based driver documents access" ON driver_documents
    FOR ALL USING (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name IN ('admin', 'manager', 'employee')
        )
    );

CREATE POLICY "Role-based driver documents insert" ON driver_documents
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name IN ('admin', 'manager')
        )
    );

CREATE POLICY "Role-based driver documents update" ON driver_documents
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name IN ('admin', 'manager')
        )
    );

CREATE POLICY "Role-based driver documents delete" ON driver_documents
    FOR DELETE USING (
        auth.uid() IN (
            SELECT e.id FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE r.name = 'admin'
        )
    );

-- 11. Create a function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_role VARCHAR(50);
    permissions JSONB;
BEGIN
    SELECT r.name, r.permissions INTO user_role, permissions
    FROM employees e
    JOIN roles r ON e.role_id = r.id
    WHERE e.id = user_id;
    
    RETURN COALESCE(permissions, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Final verification
SELECT 
    e.id,
    e.email,
    e.full_name,
    e.role,
    r.name as role_name,
    r.description as role_description,
    r.permissions
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.created_at DESC;

-- 13. Test the permissions function
SELECT get_user_permissions(auth.uid()) as current_user_permissions;

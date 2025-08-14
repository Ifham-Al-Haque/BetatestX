-- Check Current Roles and Setup Comprehensive Role System
-- This script checks existing roles and creates the specific role hierarchy requested

-- 1. Check current user and roles
SELECT '=== CURRENT USER INFO ===' as section;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM employees 
WHERE email = 'ifham@udrive.ae';

SELECT '=== ALL CURRENT ROLES ===' as section;
SELECT DISTINCT role FROM employees ORDER BY role;

-- 2. Create comprehensive roles table if it doesn't exist
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
     
    ('view', 'Read-only access to dashboard only for testing purposes', 
     '{
       "dashboard": ["view"],
       "other_pages": ["view"]
     }', 4)
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

-- 6. Assign admin role to ifham@udrive.ae specifically
UPDATE employees 
SET role = 'admin', 
    role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'ifham@udrive.ae';

-- 7. Create role-based access control functions
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

CREATE OR REPLACE FUNCTION check_user_access(user_id UUID, page_name TEXT, action TEXT DEFAULT 'view')
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    page_permissions JSONB;
BEGIN
    -- Get user permissions
    SELECT get_user_permissions(user_id) INTO user_permissions;
    
    -- Check if user has access to the page
    page_permissions := user_permissions -> page_name;
    
    -- If page_permissions is null, check if it's in other_pages
    IF page_permissions IS NULL THEN
        page_permissions := user_permissions -> 'other_pages';
    END IF;
    
    -- If still null, deny access
    IF page_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user can perform the action
    IF page_permissions = 'true' THEN
        RETURN TRUE;
    ELSIF jsonb_typeof(page_permissions) = 'array' THEN
        RETURN action = ANY(SELECT jsonb_array_elements_text(page_permissions));
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update RLS policies to use the new role system
-- Drop existing policies
DROP POLICY IF EXISTS "Role-based driver access" ON drivers;
DROP POLICY IF EXISTS "Role-based driver insert" ON drivers;
DROP POLICY IF EXISTS "Role-based driver update" ON drivers;
DROP POLICY IF EXISTS "Role-based driver delete" ON drivers;

-- Create new policies using the roles table
CREATE POLICY "Role-based driver access" ON drivers
    FOR ALL USING (
        check_user_access(auth.uid(), 'drivers', 'view')
    );

CREATE POLICY "Role-based driver insert" ON drivers
    FOR INSERT WITH CHECK (
        check_user_access(auth.uid(), 'drivers', 'create')
    );

CREATE POLICY "Role-based driver update" ON drivers
    FOR UPDATE USING (
        check_user_access(auth.uid(), 'drivers', 'edit')
    );

CREATE POLICY "Role-based driver delete" ON drivers
    FOR DELETE USING (
        check_user_access(auth.uid(), 'drivers', 'delete')
    );

-- 9. Update driver_documents policies
DROP POLICY IF EXISTS "Role-based driver documents access" ON driver_documents;
DROP POLICY IF EXISTS "Role-based driver documents insert" ON driver_documents;
DROP POLICY IF EXISTS "Role-based driver documents update" ON driver_documents;
DROP POLICY IF EXISTS "Role-based driver documents delete" ON driver_documents;

CREATE POLICY "Role-based driver documents access" ON driver_documents
    FOR ALL USING (
        check_user_access(auth.uid(), 'driver_documents', 'view')
    );

CREATE POLICY "Role-based driver documents insert" ON driver_documents
    FOR INSERT WITH CHECK (
        check_user_access(auth.uid(), 'driver_documents', 'upload')
    );

CREATE POLICY "Role-based driver documents update" ON driver_documents
    FOR UPDATE USING (
        check_user_access(auth.uid(), 'driver_documents', 'edit')
    );

CREATE POLICY "Role-based driver documents delete" ON driver_documents
    FOR DELETE USING (
        check_user_access(auth.uid(), 'drivers', 'delete')
    );

-- 10. Create storage policies for driver-profiles bucket
INSERT INTO storage.buckets (id, name, public) VALUES
    ('driver-profiles', 'driver-profiles', true),
    ('driver-documents', 'driver-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload driver profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view driver profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update driver profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete driver profile pictures" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Role-based profile upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'driver-profiles'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'drivers', 'create')
    );

CREATE POLICY "Role-based profile view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'driver-profiles'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'drivers', 'view')
    );

CREATE POLICY "Role-based profile update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'driver-profiles'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'drivers', 'edit')
    );

CREATE POLICY "Role-based profile delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'driver-profiles'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'drivers', 'delete')
    );

-- 11. Create storage policies for driver-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete driver documents" ON storage.objects;

CREATE POLICY "Role-based documents upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'driver-documents'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'driver_documents', 'upload')
    );

CREATE POLICY "Role-based documents view" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'driver-documents'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'driver_documents', 'view')
    );

CREATE POLICY "Role-based documents update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'driver-documents'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'driver_documents', 'edit')
    );

CREATE POLICY "Role-based documents delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'driver-documents'
        AND auth.role() = 'authenticated'
        AND check_user_access(auth.uid(), 'driver_documents', 'delete')
    );

-- 12. Final verification
SELECT '=== FINAL VERIFICATION ===' as section;

SELECT 'User ifham@udrive.ae role:' as info, role, role_id FROM employees WHERE email = 'ifham@udrive.ae';

SELECT 'All roles created:' as info, name, description, access_level FROM roles ORDER BY access_level;

SELECT 'Storage buckets:' as info, id, name, public FROM storage.buckets WHERE id IN ('driver-profiles', 'driver-documents');

SELECT 'Driver policies:' as info, policyname, cmd, qual FROM pg_policies WHERE tablename = 'drivers';

SELECT 'Storage policies:' as info, policyname, cmd, qual FROM storage.policies WHERE bucket_id IN ('driver-profiles', 'driver-documents');

-- 13. Test the permissions function
SELECT 'Permissions for ifham@udrive.ae:' as info, get_user_permissions((SELECT id FROM employees WHERE email = 'ifham@udrive.ae')) as permissions;

-- 14. Test access control
SELECT 'Access test results:' as info,
    check_user_access((SELECT id FROM employees WHERE email = 'ifham@udrive.ae'), 'drivers', 'create') as can_create_drivers,
    check_user_access((SELECT id FROM employees WHERE email = 'ifham@udrive.ae'), 'user_management', 'view') as can_access_user_management,
    check_user_access((SELECT id FROM employees WHERE email = 'ifham@udrive.ae'), 'dashboard', 'view') as can_view_dashboard;

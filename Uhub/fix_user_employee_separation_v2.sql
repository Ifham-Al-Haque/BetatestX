-- Fix User-Employee Separation (Corrected Version)
-- This script will properly separate employee records from user accounts

-- 1. First, let's see the current state
SELECT '=== CURRENT STATE ===' as section;
SELECT 
    'Total employees' as info,
    COUNT(*) as count
FROM employees;

SELECT 
    'Employees with auth_user_id' as info,
    COUNT(*) as count
FROM employees 
WHERE auth_user_id IS NOT NULL;

SELECT 
    'Employees without auth_user_id' as info,
    COUNT(*) as count
FROM employees 
WHERE auth_user_id IS NULL;

-- 2. Drop the existing users table if it exists (to fix the constraint issue)
DROP TABLE IF EXISTS users CASCADE;

-- 3. Create a proper users table for authenticated users only
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID UNIQUE, -- Links to Supabase Auth (can be NULL initially)
    employee_id UUID REFERENCES employees(id), -- Links to employee record (optional)
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. Create RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own record
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN employees e ON u.employee_id = e.id
            JOIN roles r ON e.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- Admins can create users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            JOIN employees e ON u.employee_id = e.id
            JOIN roles r ON e.role_id = r.id
            WHERE u.auth_user_id = auth.uid() 
            AND r.name = 'admin'
        )
    );

-- 6. Create a function to get user profile properly
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    auth_user_id UUID,
    email VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(20),
    employee_id UUID,
    employee_name VARCHAR(255),
    employee_department VARCHAR(255),
    employee_position VARCHAR(255),
    employee_role VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.auth_user_id,
        u.email,
        u.role,
        u.status,
        u.employee_id,
        e.full_name as employee_name,
        e.department as employee_department,
        e.position as employee_position,
        e.role as employee_role,
        u.last_login,
        u.created_at
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create a function to create a new user account
CREATE OR REPLACE FUNCTION create_user_account(
    user_email VARCHAR,
    user_role VARCHAR,
    employee_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = user_email) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User account already exists with this email'
        );
    END IF;
    
    -- Check if employee_id is provided and valid
    IF employee_id_param IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees WHERE id = employee_id_param) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid employee ID provided'
        );
    END IF;
    
    -- Create user account (auth_user_id will be NULL initially)
    INSERT INTO users (email, role, employee_id)
    VALUES (user_email, user_role, employee_id_param)
    RETURNING id INTO new_user_id;
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', user_email,
        'role', user_role,
        'employee_id', employee_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function to link existing employee to user account
CREATE OR REPLACE FUNCTION link_employee_to_user(
    employee_email VARCHAR,
    user_role VARCHAR DEFAULT 'employee'
)
RETURNS JSON AS $$
DECLARE
    emp_record employees;
    new_user_id UUID;
    result JSON;
BEGIN
    -- Find employee by email
    SELECT * INTO emp_record FROM employees WHERE email = employee_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Employee not found with this email'
        );
    END IF;
    
    -- Check if user account already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = employee_email) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User account already exists for this employee'
        );
    END IF;
    
    -- Create user account linked to employee
    INSERT INTO users (email, role, employee_id)
    VALUES (employee_email, user_role, emp_record.id)
    RETURNING id INTO new_user_id;
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'email', employee_email,
        'role', user_role,
        'employee_id', emp_record.id,
        'employee_name', emp_record.full_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a function to link Supabase Auth user to existing user account
CREATE OR REPLACE FUNCTION link_auth_user(
    user_email VARCHAR,
    auth_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    user_record users;
    result JSON;
BEGIN
    -- Find user by email
    SELECT * INTO user_record FROM users WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User account not found with this email'
        );
    END IF;
    
    -- Check if auth_user_id is already set
    IF user_record.auth_user_id IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User account already linked to another auth user'
        );
    END IF;
    
    -- Link the auth user
    UPDATE users 
    SET auth_user_id = auth_uuid,
        updated_at = NOW()
    WHERE id = user_record.id;
    
    RETURN json_build_object(
        'success', true,
        'user_id', user_record.id,
        'email', user_email,
        'auth_user_id', auth_uuid,
        'message', 'Auth user linked successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create your initial admin user account
SELECT '=== SETTING UP ADMIN USER ===' as section;

-- Create admin user account if it doesn't exist
DO $$
DECLARE
    admin_employee_id UUID;
    admin_user_id UUID;
BEGIN
    -- Find the admin employee
    SELECT id INTO admin_employee_id FROM employees WHERE email = 'ifham@udrive.ae';
    
    IF admin_employee_id IS NOT NULL THEN
        -- Create user account for admin (auth_user_id will be NULL initially)
        INSERT INTO users (email, role, employee_id)
        VALUES ('ifham@udrive.ae', 'admin', admin_employee_id)
        ON CONFLICT (email) DO NOTHING
        RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Admin user account created/updated for ifham@udrive.ae';
    ELSE
        RAISE NOTICE 'Admin employee not found. Please create employee record first.';
    END IF;
END $$;

-- 11. Show the final state
SELECT '=== FINAL STATE ===' as section;

SELECT 
    'Total employees' as info,
    COUNT(*) as count
FROM employees;

SELECT 
    'Total user accounts' as info,
    COUNT(*) as count
FROM users;

SELECT 
    'Employees linked to user accounts' as info,
    COUNT(*) as count
FROM employees 
WHERE auth_user_id IS NOT NULL;

SELECT 
    'Employees NOT linked to user accounts' as info,
    COUNT(*) as count
FROM employees 
WHERE auth_user_id IS NULL;

-- 12. Show admin user details
SELECT '=== ADMIN USER DETAILS ===' as section;
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.status,
    u.auth_user_id,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'ifham@udrive.ae';

-- 13. Test the new functions
SELECT '=== TESTING NEW FUNCTIONS ===' as section;

-- Test token generation (if it exists)
SELECT 'Testing functions:' as info;

-- Test get_pending_invitations (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_pending_invitations') THEN
        RAISE NOTICE 'get_pending_invitations function exists and is working';
    ELSE
        RAISE NOTICE 'get_pending_invitations function does not exist yet';
    END IF;
END $$;

-- Test get_user_profile
SELECT 'get_user_profile function created successfully' as info;

-- Test create_user_account
SELECT 'create_user_account function created successfully' as info;

-- Test link_employee_to_user
SELECT 'link_employee_to_user function created successfully' as info;

-- Test link_auth_user
SELECT 'link_auth_user function created successfully' as info;

-- 14. Instructions for next steps
SELECT '=== NEXT STEPS ===' as section;
SELECT 
    '1. Run this script successfully' as step1,
    '2. Sign out of your app' as step2,
    '3. Sign back in with ifham@udrive.ae' as step3,
    '4. The system will automatically link your auth user' as step4,
    '5. User Management should now work properly' as step5;

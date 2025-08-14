-- Check and Create Users Table
-- This script will ensure the users table exists and is properly set up

-- 1. Check if users table exists
SELECT '=== CHECKING USERS TABLE ===' as section;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'Users table EXISTS' 
        ELSE 'Users table DOES NOT EXIST' 
    END as table_status;

-- 2. If table doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Create users table
        CREATE TABLE users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            auth_user_id UUID UNIQUE,
            employee_id UUID REFERENCES employees(id),
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'employee',
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_employee_id ON users(employee_id);
        CREATE INDEX idx_users_role ON users(role);
        
        RAISE NOTICE 'Users table created successfully';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- 3. Show table structure
SELECT '=== USERS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 4. Check if admin user exists
SELECT '=== CHECKING ADMIN USER ===' as section;

DO $$
DECLARE
    admin_employee_id UUID;
    admin_user_id UUID;
BEGIN
    -- Find the admin employee
    SELECT id INTO admin_employee_id FROM employees WHERE email = 'ifham@udrive.ae';
    
    IF admin_employee_id IS NOT NULL THEN
        -- Check if admin user exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'ifham@udrive.ae') THEN
            -- Create admin user account
            INSERT INTO users (email, role, employee_id)
            VALUES ('ifham@udrive.ae', 'admin', admin_employee_id)
            RETURNING id INTO admin_user_id;
            
            RAISE NOTICE 'Admin user account created for ifham@udrive.ae';
        ELSE
            RAISE NOTICE 'Admin user account already exists for ifham@udrive.ae';
        END IF;
    ELSE
        RAISE NOTICE 'Admin employee not found. Please create employee record first.';
    END IF;
END $$;

-- 5. Show current users
SELECT '=== CURRENT USERS ===' as section;
SELECT 
    id,
    email,
    role,
    status,
    auth_user_id IS NOT NULL as is_linked,
    created_at
FROM users
ORDER BY created_at DESC;

-- 6. Test basic operations
SELECT '=== TESTING BASIC OPERATIONS ===' as section;
SELECT 'Users table is ready for basic operations' as info;



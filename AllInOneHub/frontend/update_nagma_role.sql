-- Update nagma@udrive.ae role to hr_manager
-- This script ensures nagma@udrive.ae has the correct role to access all complaints

-- First, check current status
SELECT 
    'Current nagma@udrive.ae status:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'nagma@udrive.ae';

-- Check if nagma@udrive.ae exists in users table
DO $$
DECLARE
    user_exists BOOLEAN;
    current_role TEXT;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'nagma@udrive.ae') INTO user_exists;
    
    IF user_exists THEN
        -- Get current role
        SELECT role INTO current_role FROM users WHERE email = 'nagma@udrive.ae';
        RAISE NOTICE 'User nagma@udrive.ae exists with role: %', current_role;
        
        -- Update role to hr_manager if not already
        IF current_role != 'hr_manager' THEN
            UPDATE users 
            SET role = 'hr_manager', 
                updated_at = NOW()
            WHERE email = 'nagma@udrive.ae';
            RAISE NOTICE 'Updated nagma@udrive.ae role to hr_manager';
        ELSE
            RAISE NOTICE 'nagma@udrive.ae already has hr_manager role';
        END IF;
    ELSE
        RAISE NOTICE 'User nagma@udrive.ae not found in users table';
        
        -- Check if employee exists
        IF EXISTS(SELECT 1 FROM employees WHERE email = 'nagma@udrive.ae') THEN
            RAISE NOTICE 'Employee nagma@udrive.ae exists, creating user record...';
            
            -- Get employee ID
            DECLARE
                emp_id UUID;
            BEGIN
                SELECT id INTO emp_id FROM employees WHERE email = 'nagma@udrive.ae';
                
                -- Create user record
                INSERT INTO users (
                    auth_user_id,
                    employee_id,
                    email,
                    role,
                    status,
                    created_at,
                    updated_at
                ) VALUES (
                    (SELECT id FROM auth.users WHERE email = 'nagma@udrive.ae'),
                    emp_id,
                    'nagma@udrive.ae',
                    'hr_manager',
                    'active',
                    NOW(),
                    NOW()
                );
                RAISE NOTICE 'Created user record for nagma@udrive.ae with hr_manager role';
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error creating user record: %', SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Employee nagma@udrive.ae not found either';
        END IF;
    END IF;
END $$;

-- Verify the update
SELECT 
    'Updated nagma@udrive.ae status:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'nagma@udrive.ae';

-- Check if nagma@udrive.ae can now access complaints
-- This will test the role check function
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_admin_or_hr_manager'
    ) THEN
        RAISE NOTICE 'Role check function exists';
        RAISE NOTICE 'nagma@udrive.ae should now be able to see all complaints';
    ELSE
        RAISE NOTICE 'Role check function does not exist - run fix_complaints_rls_final.sql first';
    END IF;
END $$;

-- Final status
SELECT 
    'Role update completed' as status,
    CASE 
        WHEN (SELECT role FROM users WHERE email = 'nagma@udrive.ae') = 'hr_manager' 
        THEN 'SUCCESS: nagma@udrive.ae now has hr_manager role'
        ELSE 'FAILED: nagma@udrive.ae role not updated correctly'
    END as result;

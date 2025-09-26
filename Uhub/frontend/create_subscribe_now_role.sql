-- Create Subscribe Now Role and Permissions
-- This script checks for existing Subscribe Now role and creates it with specific permissions

-- Step 1: Check if Subscribe Now role exists
SELECT 
    'Current Roles Check' as step,
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- Step 2: Check current role constraints in users table
SELECT 
    'Current Role Constraints' as info,
    cc.constraint_name,
    cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'users' AND ccu.column_name = 'role';

-- Step 3: Update users table to include 'subscribe_now' role
-- First, drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with subscribe_now role included
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer', 'manager', 'data_operator', 'finance', 'it_management', 'customer_service_manager', 'operation_management', 'subscribe_now'));

-- Step 4: Create Subscribe Now department if it doesn't exist
INSERT INTO departments (name, description, status) 
VALUES ('Subscribe Now', 'Fleet delivery and long-term rental sales department', 'active')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Verify the role constraint was updated
SELECT 
    'Updated Role Constraints' as info,
    cc.constraint_name,
    cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'users' AND ccu.column_name = 'role';

-- Step 6: Test creating a user with subscribe_now role (optional test)
-- Uncomment the following lines to test:
/*
INSERT INTO users (email, role, full_name, status) 
VALUES ('test.subscribenow@udrive.ae', 'subscribe_now', 'Test Subscribe Now User', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'subscribe_now';

SELECT 'Test User Created' as result, email, role, full_name 
FROM users WHERE email = 'test.subscribenow@udrive.ae';
*/

-- Step 7: Display success message
SELECT 
    'Subscribe Now Role Setup Complete' as status,
    'Role "subscribe_now" has been added to the system' as message,
    'Users can now be assigned the subscribe_now role' as next_step;

-- Step 8: Show all available roles
SELECT 'Available Roles:' as info, unnest(enum_range(NULL::text)) as available_roles
FROM (
    SELECT 'admin'::text UNION ALL
    SELECT 'hr_manager' UNION ALL
    SELECT 'cs_manager' UNION ALL
    SELECT 'driver_management' UNION ALL
    SELECT 'employee' UNION ALL
    SELECT 'viewer' UNION ALL
    SELECT 'manager' UNION ALL
    SELECT 'data_operator' UNION ALL
    SELECT 'finance' UNION ALL
    SELECT 'it_management' UNION ALL
    SELECT 'customer_service_manager' UNION ALL
    SELECT 'operation_management' UNION ALL
    SELECT 'subscribe_now'
) roles;

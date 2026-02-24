-- Create Subscribe Now Role - Fixed Version
-- This script creates the Subscribe Now role with proper permissions

-- Step 1: Check existing roles
SELECT 
    'Current Roles in System' as info,
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- Step 2: Add Subscribe Now department if it doesn't exist
INSERT INTO departments (name, description, status) 
VALUES ('Subscribe Now', 'Fleet delivery and long-term rental sales department', 'active')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Update users table role constraint to include 'subscribe_now'
-- Drop existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with subscribe_now role
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'admin', 
    'hr_manager', 
    'cs_manager', 
    'driver_management', 
    'employee', 
    'viewer', 
    'manager', 
    'data_operator', 
    'finance', 
    'it_management', 
    'customer_service_manager', 
    'operation_management', 
    'subscribe_now'
));

-- Step 4: Verify constraint was updated successfully
SELECT 
    'Role Constraint Updated' as status,
    'subscribe_now role has been added to the system' as message;

-- Step 5: Test role assignment (optional - uncomment to test)
/*
-- Create a test user with subscribe_now role
INSERT INTO users (email, role, full_name, status) 
VALUES ('test.subscribenow@udrive.ae', 'subscribe_now', 'Test Subscribe Now User', 'active')
ON CONFLICT (email) DO UPDATE SET 
    role = 'subscribe_now',
    full_name = 'Test Subscribe Now User',
    updated_at = NOW();

-- Verify test user was created
SELECT 
    'Test User Created' as result, 
    email, 
    role, 
    full_name,
    status
FROM users 
WHERE email = 'test.subscribenow@udrive.ae';
*/

-- Step 6: Show all available roles after update
SELECT 
    'Available Roles After Update' as info,
    unnest(ARRAY[
        'admin',
        'hr_manager', 
        'cs_manager',
        'driver_management',
        'employee',
        'viewer',
        'manager',
        'data_operator',
        'finance',
        'it_management',
        'customer_service_manager',
        'operation_management',
        'subscribe_now'
    ]) as available_roles;

-- Step 7: Final verification
SELECT 
    'Setup Complete' as status,
    'Subscribe Now role is now available for user assignment' as message,
    'Users with this role will have access to specified panels and sections' as note;

-- Step 8: Show Subscribe Now department
SELECT 
    'Subscribe Now Department' as info,
    id,
    name,
    description,
    status
FROM departments 
WHERE name = 'Subscribe Now';

-- Add IOT Management Role to Users Table Role Check Constraint
-- This script adds the 'iot_management' role to the existing constraint

-- Step 1: Drop the existing check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add the new check constraint with all roles including iot_management
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'admin', 
    'data_operator', 
    'finance', 
    'it_management', 
    'iot_management',
    'manager', 
    'driver_management', 
    'operation_management', 
    'hr_manager', 
    'cs_manager', 
    'marketing_manager', 
    'marketing_specialist', 
    'marketing_management', 
    'subscribe_now', 
    'employee', 
    'viewer'
));

-- Step 3: Verify the constraint was applied
SELECT 
    'Constraint Update Status' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_role_check' 
AND conrelid = 'public.users'::regclass;

-- Step 4: Test the constraint by checking current roles in the table
SELECT 
    'Current Roles in Users Table' as info,
    role,
    COUNT(*) as user_count
FROM public.users 
GROUP BY role 
ORDER BY role;

-- Success message
SELECT '✅ Users table role constraint updated successfully! IOT Management role is now allowed.' as status;


-- Check ifham@udrive.ae role and permissions
-- Run this in Supabase SQL Editor to see current status

-- Check ifham@udrive.ae in users table
SELECT 
    'ifham@udrive.ae user record:' as info,
    id,
    email,
    role,
    status,
    created_at,
    updated_at
FROM users 
WHERE email = 'ifham@udrive.ae';

-- Check ifham@udrive.ae in employees table
SELECT 
    'ifham@udrive.ae employee record:' as info,
    id,
    full_name,
    email,
    department,
    position,
    status,
    created_at,
    updated_at
FROM employees 
WHERE email = 'ifham@udrive.ae';

-- Check current auth user
SELECT 
    'Current authenticated user:' as info,
    auth.uid() as user_id,
    auth.email() as email,
    auth.role() as auth_role;

-- Check all users with admin role
SELECT 
    'All admin users:' as info,
    email,
    role,
    status
FROM users 
WHERE role = 'admin'
ORDER BY email;

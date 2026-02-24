-- Check all user roles to see what roles actually exist
-- Run this in Supabase SQL Editor

-- Step 1: Check all users and their roles
SELECT 
    'All users and their roles:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position,
    u.updated_at
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
ORDER BY u.role, u.email;

-- Step 2: Check ifham@udrive.ae specifically
SELECT 
    'ifham@udrive.ae details:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'ifham@udrive.ae';

-- Step 3: Count users by role
SELECT 
    'Complete role distribution:' as info,
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- Step 4: Check if there are any users that should be IT Management
-- Look for users with IT-related emails or departments
SELECT 
    'Potential IT Management users:' as info,
    u.email,
    u.role,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE LOWER(u.email) LIKE '%it%' 
   OR LOWER(e.department) LIKE '%it%' 
   OR LOWER(e.position) LIKE '%it%'
   OR LOWER(e.position) LIKE '%tech%'
   OR LOWER(e.position) LIKE '%developer%'
   OR LOWER(e.position) LIKE '%system%'
ORDER BY u.email;

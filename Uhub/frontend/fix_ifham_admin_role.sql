-- Fix ifham@udrive.ae admin role
-- Run this in Supabase SQL Editor

-- First, check current status
SELECT 
    'Current ifham@udrive.ae status:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'ifham@udrive.ae';

-- Update ifham@udrive.ae to admin role
UPDATE users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'ifham@udrive.ae';

-- Verify the update
SELECT 
    'Updated ifham@udrive.ae status:' as info,
    email,
    role,
    status,
    updated_at
FROM users 
WHERE email = 'ifham@udrive.ae';

-- Check all admin users
SELECT 
    'All admin users:' as info,
    email,
    role,
    status,
    updated_at
FROM users 
WHERE role = 'admin'
ORDER BY email;

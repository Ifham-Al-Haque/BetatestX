-- Check and fix roles for Admin, HR Manager, and IT Management users
-- Run this in Supabase SQL Editor

-- Step 1: Check current status of all users with these roles
SELECT 
    'Current Admin, HR Manager, and IT Management users:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position,
    u.updated_at
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.role IN ('admin', 'hr_manager', 'it_management')
ORDER BY u.role, u.email;

-- Step 2: Check ifham@udrive.ae specifically
SELECT 
    'ifham@udrive.ae current status:' as info,
    u.email,
    u.role,
    u.status,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'ifham@udrive.ae';

-- Step 3: Update ifham@udrive.ae to admin role (if not already)
UPDATE users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'ifham@udrive.ae' AND role != 'admin';

-- Step 4: Check for any users that might need role updates
-- (You can modify these emails based on your actual users)

-- Example: Update specific users to correct roles
-- UPDATE users SET role = 'hr_manager' WHERE email = 'hr_manager@udrive.ae';
-- UPDATE users SET role = 'it_management' WHERE email = 'it_manager@udrive.ae';

-- Step 5: Verify all updates
SELECT 
    'Final status after updates:' as info,
    u.email,
    u.role,
    u.status,
    u.updated_at
FROM users u
WHERE u.role IN ('admin', 'hr_manager', 'it_management')
ORDER BY u.role, u.email;

-- Step 6: Check total count of each role
SELECT 
    'Role distribution:' as info,
    role,
    COUNT(*) as user_count
FROM users 
WHERE role IN ('admin', 'hr_manager', 'it_management')
GROUP BY role
ORDER BY role;

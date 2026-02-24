-- Assign proper roles for Employee Onboarding and Offboarding access
-- Run this in Supabase SQL Editor after checking all user roles

-- Step 1: Update ifham@udrive.ae to admin role (if not already)
UPDATE users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'ifham@udrive.ae' AND role != 'admin';

-- Step 2: Example - Update specific users to IT Management role
-- (Uncomment and modify these lines based on your actual users)

-- UPDATE users SET role = 'it_management' WHERE email = 'it_manager@udrive.ae';
-- UPDATE users SET role = 'it_management' WHERE email = 'tech_lead@udrive.ae';
-- UPDATE users SET role = 'it_management' WHERE email = 'system_admin@udrive.ae';

-- Step 3: Example - Update specific users to HR Manager role
-- (Uncomment and modify these lines based on your actual users)

-- UPDATE users SET role = 'hr_manager' WHERE email = 'hr_manager@udrive.ae';
-- UPDATE users SET role = 'hr_manager' WHERE email = 'hr_director@udrive.ae';

-- Step 4: Verify the updates
SELECT 
    'Final role distribution:' as info,
    role,
    COUNT(*) as user_count
FROM users 
WHERE role IN ('admin', 'hr_manager', 'it_management')
GROUP BY role
ORDER BY role;

-- Step 5: Show all users who can access Employee Onboarding/Offboarding
SELECT 
    'Users with access to Employee Onboarding/Offboarding:' as info,
    u.email,
    u.role,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.role IN ('admin', 'hr_manager', 'it_management')
ORDER BY u.role, u.email;

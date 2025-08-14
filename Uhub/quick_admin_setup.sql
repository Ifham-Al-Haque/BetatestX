-- Quick Admin Setup Script
-- This script quickly assigns admin role to fix the immediate RLS issue

-- 1. Check current user roles
SELECT id, email, full_name, role, created_at FROM employees ORDER BY created_at DESC LIMIT 5;

-- 2. Assign admin role to the first user (usually the system owner)
UPDATE employees 
SET role = 'admin' 
WHERE id = (SELECT id FROM employees ORDER BY created_at ASC LIMIT 1);

-- 3. Verify the change
SELECT id, email, full_name, role, created_at FROM employees WHERE role = 'admin';

-- 4. Test if the user can now access drivers table
-- This should work after the role update
SELECT * FROM drivers LIMIT 1;

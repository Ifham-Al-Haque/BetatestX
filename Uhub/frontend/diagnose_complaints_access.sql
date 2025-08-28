-- Diagnose Complaints Access Issues
-- This script helps identify why nagma@udrive.ae cannot see all complaints

-- 1. Check if complaints table exists and has RLS enabled
SELECT 
    'Complaints table status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'complaints';

-- 2. Check current RLS policies
SELECT 
    'Current RLS policies:' as info,
    policyname,
    cmd as operation,
    permissive,
    qual as condition
FROM pg_policies 
WHERE tablename = 'complaints'
ORDER BY policyname;

-- 3. Check if nagma@udrive.ae exists in auth.users
SELECT 
    'Auth users check:' as info,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'nagma@udrive.ae';

-- 4. Check if nagma@udrive.ae exists in users table
SELECT 
    'Users table check:' as info,
    auth_user_id,
    email,
    role,
    status,
    employee_id
FROM users 
WHERE email = 'nagma@udrive.ae';

-- 5. Check if nagma@udrive.ae exists in employees table
SELECT 
    'Employees table check:' as info,
    id,
    email,
    full_name,
    department,
    position,
    status
FROM employees 
WHERE email = 'nagma@udrive.ae';

-- 6. Check total complaints count
SELECT 
    'Total complaints:' as info,
    COUNT(*) as total_complaints
FROM complaints;

-- 7. Check complaints by complainant
SELECT 
    'Complaints by complainant:' as info,
    complainant_email,
    complainant_name,
    COUNT(*) as complaint_count
FROM complaints 
GROUP BY complainant_email, complainant_name
ORDER BY complaint_count DESC;

-- 8. Test the role check function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_admin_or_hr_manager'
    ) THEN
        RAISE NOTICE 'Role check function exists, testing...';
        -- Note: This will only work if you're running as nagma@udrive.ae
        PERFORM is_admin_or_hr_manager();
    ELSE
        RAISE NOTICE 'Role check function does not exist';
    END IF;
END $$;

-- 9. Check user permissions
SELECT 
    'User permissions:' as info,
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'complaints'
AND grantee IN ('authenticated', 'anon', 'service_role');

-- 10. Check if there are any constraints or triggers
SELECT 
    'Table constraints:' as info,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'complaints';

-- 11. Check for any views that might be affecting access
SELECT 
    'Views referencing complaints:' as info,
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%complaints%';

-- 12. Summary and recommendations
SELECT 
    'DIAGNOSIS SUMMARY:' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') = 0 
        THEN 'No RLS policies found - this is the problem!'
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') < 3 
        THEN 'Insufficient RLS policies - missing admin/HR access policies'
        ELSE 'RLS policies exist - check role assignment'
    END as issue_description,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE email = 'nagma@udrive.ae') = 0 
        THEN 'nagma@udrive.ae not found in users table - create user record first'
        WHEN (SELECT role FROM users WHERE email = 'nagma@udrive.ae') NOT IN ('admin', 'hr_manager') 
        THEN 'nagma@udrive.ae role is not admin or hr_manager - update role'
        ELSE 'User exists with correct role - check RLS policies'
    END as user_issue,
    
    'Run fix_complaints_rls_final.sql to fix RLS policies' as recommended_action;

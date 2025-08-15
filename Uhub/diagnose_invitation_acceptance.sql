-- Diagnostic script for invitation acceptance issues
-- Run this to identify any remaining problems

-- 1. Check if all required functions exist
SELECT '=== CHECKING REQUIRED FUNCTIONS ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
FROM pg_proc p
WHERE p.proname IN ('accept_invitation', 'get_invitation_by_token', 'get_pending_invitations')
ORDER BY p.proname;

-- 2. Check function permissions
SELECT '=== CHECKING FUNCTION PERMISSIONS ===' as section;
SELECT 
    p.proname as function_name,
    r.rolname as role_name,
    has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname IN ('accept_invitation', 'get_invitation_by_token')
AND r.rolname IN ('anon', 'authenticated')
ORDER BY p.proname, r.rolname;

-- 3. Check table structures and constraints
SELECT '=== CHECKING TABLE STRUCTURES ===' as section;

-- Users table
SELECT 'Users table:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE WHEN is_identity = 'YES' THEN 'IDENTITY' ELSE 'NOT IDENTITY' END as identity_status
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Employees table
SELECT 'Employees table:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Invitations table
SELECT 'Invitations table:' as table_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check RLS policies
SELECT '=== CHECKING RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'employees', 'invitations')
ORDER BY tablename, policyname;

-- 5. Check for any data inconsistencies
SELECT '=== CHECKING DATA CONSISTENCY ===' as section;

-- Check if there are any orphaned records
SELECT 'Orphaned user records (no matching employee):' as check_type;
SELECT COUNT(*) as orphaned_users
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE e.id IS NULL;

SELECT 'Orphaned employee records (no matching user):' as check_type;
SELECT COUNT(*) as orphaned_employees
FROM employees e
LEFT JOIN users u ON e.id = u.employee_id
WHERE u.id IS NULL;

-- 6. Test invitation access
SELECT '=== TESTING INVITATION ACCESS ===' as section;

-- Check if we have any valid invitations
SELECT 'Valid pending invitations:' as test_type;
SELECT COUNT(*) as invitation_count
FROM invitations 
WHERE status = 'pending' 
AND expires_at > NOW();

-- Check if we can access invitations directly
SELECT 'Direct table access test:' as test_type;
SELECT COUNT(*) as accessible_count
FROM invitations 
WHERE token IS NOT NULL;

-- 7. Show any error logs or issues
SELECT '=== POTENTIAL ISSUES ===' as section;

-- Check for any tables without proper indexes
SELECT 'Tables without primary keys:' as issue_type;
SELECT table_name
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('users', 'employees', 'invitations')
AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = t.table_name
    AND tc.constraint_type = 'PRIMARY KEY'
);

-- Check for any missing foreign key constraints
SELECT 'Missing foreign key relationships:' as issue_type;
SELECT 
    'users.employee_id -> employees.id' as relationship
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'users'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE '%employee_id%'
);

SELECT '=== DIAGNOSTIC COMPLETED ===' as section;
SELECT 'Review the results above for any issues' as next_step;

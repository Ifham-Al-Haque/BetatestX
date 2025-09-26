-- Diagnostic script to identify role column usage issues
-- Run this in your Supabase SQL Editor

-- 1. Check if employees table has role column
SELECT 
    'Employees Table Role Column Check' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'role'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check if users table has role column
SELECT 
    'Users Table Role Column Check' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 3. Show all columns in employees table
SELECT 
    'Employees Table Columns' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 4. Show all columns in users table
SELECT 
    'Users Table Columns' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Check for any views or functions that might reference employees.role
SELECT 
    'Views/Functions referencing employees.role' as check_type,
    schemaname,
    viewname as object_name,
    'view' as object_type
FROM pg_views 
WHERE definition LIKE '%employees%role%'
UNION ALL
SELECT 
    'Views/Functions referencing employees.role' as check_type,
    n.nspname as schemaname,
    p.proname as object_name,
    'function' as object_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%employees%role%';

-- 6. Test a simple query on employees table
SELECT 
    'Test Query on Employees' as test_name,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN designation IS NOT NULL THEN 1 END) as with_designation,
    COUNT(CASE WHEN position IS NOT NULL THEN 1 END) as with_position
FROM employees;

-- 7. Test a simple query on users table
SELECT 
    'Test Query on Users' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as with_role,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as with_auth_id
FROM users;

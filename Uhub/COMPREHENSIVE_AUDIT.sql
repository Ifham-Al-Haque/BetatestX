-- COMPREHENSIVE USER MANAGEMENT SYSTEM AUDIT
-- Run this in your Supabase SQL Editor to find ALL issues

-- 1. Check what functions exist and their signatures
SELECT '=== EXISTING FUNCTIONS ===' as audit_section;

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'accept_invitation',
    'send_invitation', 
    'cancel_invitation',
    'resend_invitation',
    'get_pending_invitations',
    'invite_user',
    'get_invitation_by_token'
)
ORDER BY p.proname, p.oid;

-- 2. Check for function overloads (multiple versions of same function)
SELECT '=== FUNCTION OVERLOADS ===' as audit_section;

SELECT 
    proname as function_name,
    COUNT(*) as overload_count,
    array_agg(proargtypes::regtype[] ORDER BY proargtypes) as parameter_types
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'accept_invitation',
    'send_invitation', 
    'cancel_invitation',
    'resend_invitation',
    'get_pending_invitations',
    'invite_user',
    'get_invitation_by_token'
)
GROUP BY proname
HAVING COUNT(*) > 1
ORDER BY proname;

-- 3. Check table structures
SELECT '=== TABLE STRUCTURES ===' as audit_section;

-- Check invitations table
SELECT 'invitations table:' as table_name;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check users table
SELECT 'users table:' as table_name;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check employees table
SELECT 'employees table:' as table_name;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check RLS policies
SELECT '=== RLS POLICIES ===' as audit_section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('invitations', 'users', 'employees')
ORDER BY tablename, policyname;

-- 5. Check permissions
SELECT '=== PERMISSIONS ===' as audit_section;

SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
AND table_name IN ('invitations', 'users', 'employees')
ORDER BY table_name, grantee, privilege_type;

-- 6. Test function calls with sample data
SELECT '=== FUNCTION TESTING ===' as audit_section;

-- Test get_pending_invitations
SELECT 'Testing get_pending_invitations...' as test_name;
SELECT * FROM get_pending_invitations() LIMIT 1;

-- Test invite_user (will fail if function doesn't exist)
SELECT 'Testing invite_user...' as test_name;
SELECT invite_user('test@example.com', 'employee', '00000000-0000-0000-0000-000000000000');

-- 7. Check for any syntax errors in function definitions
SELECT '=== FUNCTION SYNTAX CHECK ===' as audit_section;

SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.prosrc IS NULL THEN 'NULL source'
        WHEN p.prosrc = '' THEN 'Empty source'
        ELSE 'Has source'
    END as source_status,
    CASE 
        WHEN p.prolang = 0 THEN 'Internal'
        WHEN p.prolang = 1 THEN 'SQL'
        WHEN p.prolang = 2 THEN 'C'
        WHEN p.prolang = 3 THEN 'Internal'
        WHEN p.prolang = 4 THEN 'C'
        WHEN p.prolang = 5 THEN 'PL/pgSQL'
        ELSE 'Unknown: ' || p.prolang
    END as language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'accept_invitation',
    'send_invitation', 
    'cancel_invitation',
    'resend_invitation',
    'get_pending_invitations',
    'invite_user',
    'get_invitation_by_token'
)
ORDER BY p.proname;

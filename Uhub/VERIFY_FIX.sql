-- VERIFICATION SCRIPT - Check if the fix was applied
-- Run this in your Supabase SQL Editor

-- 1. Check what functions currently exist
SELECT '=== CURRENT FUNCTIONS ===' as check_section;

SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.oid as function_id
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

-- 2. Check for function overloads
SELECT '=== FUNCTION OVERLOADS ===' as check_section;

SELECT 
    p.proname as function_name,
    COUNT(*) as overload_count,
    array_agg(p.proargtypes::regtype[] ORDER BY p.proargtypes) as parameter_types
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
GROUP BY p.proname
HAVING COUNT(*) > 1
ORDER BY p.proname;

-- 3. Test if the functions work
SELECT '=== FUNCTION TESTS ===' as check_section;

-- Test get_pending_invitations
SELECT 'Testing get_pending_invitations...' as test_name;
SELECT * FROM get_pending_invitations() LIMIT 1;

-- Test invite_user
SELECT 'Testing invite_user...' as test_name;
SELECT invite_user('test@example.com', 'employee', '00000000-0000-0000-0000-000000000000');

-- 4. Check function permissions
SELECT '=== FUNCTION PERMISSIONS ===' as check_section;

SELECT 
    p.proname as function_name,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_pending_invitations', 
    'invite_user', 
    'accept_invitation', 
    'get_invitation_by_token'
)
ORDER BY p.proname;

-- 5. Summary
SELECT '=== SUMMARY ===' as check_section;

SELECT 
    COUNT(*) as total_functions,
    COUNT(CASE WHEN pg_get_function_arguments(p.oid) LIKE '%VARCHAR%' THEN 1 END) as varchar_functions,
    COUNT(CASE WHEN pg_get_function_arguments(p.oid) LIKE '%TEXT%' THEN 1 END) as text_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_pending_invitations', 
    'invite_user', 
    'accept_invitation', 
    'get_invitation_by_token'
);

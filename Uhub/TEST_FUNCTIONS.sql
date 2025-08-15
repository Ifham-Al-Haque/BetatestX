-- TEST SCRIPT - Verify all functions work correctly
-- Run this in your Supabase SQL Editor

-- 1. Test get_pending_invitations
SELECT '=== TESTING get_pending_invitations ===' as test_section;
SELECT * FROM get_pending_invitations() LIMIT 1;

-- 2. Test invite_user
SELECT '=== TESTING invite_user ===' as test_section;
SELECT invite_user(
    'test@example.com'::character varying, 
    'employee'::character varying, 
    '00000000-0000-0000-0000-000000000000'::uuid
);

-- 3. Test get_invitation_by_token
SELECT '=== TESTING get_invitation_by_token ===' as test_section;
SELECT * FROM get_invitation_by_token('test-token'::character varying) LIMIT 1;

-- 4. Test accept_invitation with EXACT frontend parameters
SELECT '=== TESTING accept_invitation ===' as test_section;
SELECT accept_invitation(
    'test-token'::character varying,           -- invitation_token
    'testpassword'::character varying,        -- user_password
    'Test User'::character varying,            -- full_name
    '1234567890'::character varying,          -- phone
    'Test Location'::character varying         -- location
);

-- 5. Check if there are any other conflicting functions
SELECT '=== CHECKING FOR OTHER FUNCTIONS ===' as test_section;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%invitation%'
ORDER BY p.proname;

-- 6. Test function permissions
SELECT '=== CHECKING PERMISSIONS ===' as test_section;
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

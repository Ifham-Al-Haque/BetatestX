-- Check for any remaining function conflicts
-- Run this after applying the fix to verify all conflicts are resolved

SELECT '=== CHECKING FOR FUNCTION CONFLICTS ===' as section;

-- Check for multiple functions with the same name
SELECT 
    p.proname as function_name,
    COUNT(*) as function_count,
    array_agg(pg_get_function_identity_arguments(p.oid)) as all_signatures
FROM pg_proc p
WHERE p.proname IN ('send_invitation', 'cancel_invitation', 'resend_invitation', 'get_pending_invitations')
GROUP BY p.proname
HAVING COUNT(*) > 1
ORDER BY p.proname;

-- If no conflicts found, show the single functions
SELECT '=== SINGLE FUNCTIONS (NO CONFLICTS) ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname IN ('send_invitation', 'cancel_invitation', 'resend_invitation', 'get_pending_invitations')
ORDER BY p.proname;

-- Check if functions exist and are accessible
SELECT '=== FUNCTION ACCESSIBILITY CHECK ===' as section;
SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    p.prolang::regtype as language
FROM pg_proc p
WHERE p.proname IN ('send_invitation', 'cancel_invitation', 'resend_invitation', 'get_pending_invitations')
ORDER BY p.proname;

-- Check permissions
SELECT '=== FUNCTION PERMISSIONS ===' as section;
SELECT 
    p.proname as function_name,
    array_agg(privilege_type) as permissions
FROM pg_proc p
JOIN information_schema.routine_privileges rp ON p.proname = rp.routine_name
WHERE p.proname IN ('send_invitation', 'cancel_invitation', 'resend_invitation', 'get_pending_invitations')
GROUP BY p.proname
ORDER BY p.proname;

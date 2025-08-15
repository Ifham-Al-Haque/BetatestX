-- Check the exact signature of the accept_invitation function
SELECT '=== CHECKING FUNCTION SIGNATURE ===' as section;

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.proargtypes as parameter_types,
    p.proargnames as parameter_names
FROM pg_proc p
WHERE p.proname = 'accept_invitation';

-- Check if there are multiple versions of the function
SELECT '=== CHECKING FOR FUNCTION OVERLOADS ===' as section;
SELECT 
    p.proname as function_name,
    p.oid as function_oid,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.proargtypes as parameter_types,
    p.proargnames as parameter_names
FROM pg_proc p
WHERE p.proname = 'accept_invitation'
ORDER BY p.oid;

-- Show the function definition
SELECT '=== FUNCTION DEFINITION ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'accept_invitation'
LIMIT 1;

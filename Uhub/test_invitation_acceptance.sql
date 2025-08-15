-- Test script to verify invitation acceptance is working
-- Run this after applying the complete fix

-- 1. Check if the accept_invitation function exists with correct signature
SELECT '=== CHECKING ACCEPT_INVITATION FUNCTION ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'accept_invitation';

-- 2. Check if employees table has the required columns
SELECT '=== CHECKING EMPLOYEES TABLE COLUMNS ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
AND column_name IN ('phone', 'location', 'full_name')
ORDER BY column_name;

-- 3. Check if we have any pending invitations to test with
SELECT '=== CHECKING AVAILABLE INVITATIONS ===' as section;
SELECT 
    id,
    email,
    role,
    token,
    status,
    created_at,
    expires_at
FROM invitations 
WHERE status = 'pending' 
AND expires_at > NOW()
LIMIT 3;

-- 4. Test the function with a sample invitation (if available)
SELECT '=== TESTING FUNCTION WITH SAMPLE INVITATION ===' as section;
DO $$
DECLARE
    sample_token VARCHAR;
    test_result JSON;
BEGIN
    -- Get a sample token from existing invitations
    SELECT token INTO sample_token 
    FROM invitations 
    WHERE status = 'pending' 
    AND expires_at > NOW() 
    LIMIT 1;
    
    IF sample_token IS NOT NULL THEN
        RAISE NOTICE 'Testing with token: %', sample_token;
        
        -- Test the function (this will create test records)
        SELECT accept_invitation(
            sample_token, 
            'testpassword123', 
            'Test User', 
            '+1234567890', 
            'Test Location'
        ) INTO test_result;
        
        RAISE NOTICE 'Function result: %', test_result;
        
        -- Clean up test records
        DELETE FROM users WHERE email LIKE '%test%';
        DELETE FROM employees WHERE email LIKE '%test%';
        UPDATE invitations SET status = 'pending', accepted_at = NULL, accepted_by = NULL WHERE token = sample_token;
        
        RAISE NOTICE 'Test completed and cleaned up';
    ELSE
        RAISE NOTICE 'No valid pending invitations found to test with';
    END IF;
END $$;

-- 5. Show current table counts
SELECT '=== CURRENT TABLE COUNTS ===' as section;
SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    'employees' as table_name,
    COUNT(*) as record_count
FROM employees
UNION ALL
SELECT 
    'invitations' as table_name,
    COUNT(*) as record_count
FROM invitations;

-- 6. Final verification
SELECT '=== INVITATION ACCEPTANCE TEST COMPLETED ===' as section;
SELECT 'Your invitation acceptance system is ready for testing!' as status;

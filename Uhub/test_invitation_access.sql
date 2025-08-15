-- Test script to verify invitation access is working
-- Run this after applying the RLS fix to check if invitations can be accessed

-- 1. Check if we have any invitations in the table
SELECT '=== CHECKING INVITATIONS TABLE ===' as section;
SELECT 
    COUNT(*) as total_invitations,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invitations,
    COUNT(CASE WHEN status = 'pending' AND expires_at > NOW() THEN 1 END) as valid_pending_invitations
FROM invitations;

-- 2. Check if the get_invitation_by_token function exists
SELECT '=== CHECKING FUNCTION ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'get_invitation_by_token';

-- 3. Test the function with a sample token (if invitations exist)
SELECT '=== TESTING FUNCTION ===' as section;
DO $$
DECLARE
    sample_token TEXT;
    invitation_count INTEGER;
BEGIN
    -- Get a sample token from existing invitations
    SELECT token INTO sample_token 
    FROM invitations 
    WHERE status = 'pending' 
    AND expires_at > NOW() 
    LIMIT 1;
    
    IF sample_token IS NOT NULL THEN
        RAISE NOTICE 'Testing with token: %', sample_token;
        
        -- Test the function
        SELECT COUNT(*) INTO invitation_count 
        FROM get_invitation_by_token(sample_token);
        
        RAISE NOTICE 'Function returned % invitations', invitation_count;
        
        -- Show the invitation details
        RAISE NOTICE 'Invitation details:';
        FOR r IN SELECT * FROM get_invitation_by_token(sample_token) LOOP
            RAISE NOTICE 'ID: %, Email: %, Role: %, Status: %', r.id, r.email, r.role, r.status;
        END LOOP;
    ELSE
        RAISE NOTICE 'No valid pending invitations found to test with';
    END IF;
END $$;

-- 4. Check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'invitations'
ORDER BY policyname;

-- 5. Test direct table access (this should work now)
SELECT '=== TESTING DIRECT TABLE ACCESS ===' as section;
SELECT 
    'Direct table access test' as test_type,
    COUNT(*) as accessible_invitations
FROM invitations 
WHERE token IS NOT NULL 
AND status = 'pending' 
AND expires_at > NOW();

-- 6. Show sample invitation data for testing
SELECT '=== SAMPLE INVITATION DATA ===' as section;
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

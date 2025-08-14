-- =====================================================
-- DIAGNOSE USERS TABLE RLS INFINITE RECURSION ISSUE
-- =====================================================
-- This script helps diagnose the current state of RLS policies
-- and identifies what's causing the infinite recursion

-- 1. Check if RLS is enabled on users table
SELECT '=== RLS STATUS CHECK ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS is ENABLED - This could cause issues'
        ELSE 'RLS is DISABLED - This should work'
    END as status
FROM pg_tables 
WHERE tablename = 'users';

-- 2. Check existing RLS policies
SELECT '=== EXISTING RLS POLICIES ===' as section;
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN qual LIKE '%users%' THEN '⚠️ POTENTIAL RECURSION - Policy references users table'
        WHEN qual LIKE '%auth.uid%' THEN '⚠️ POTENTIAL RECURSION - Policy uses auth.uid()'
        ELSE '✅ SAFE - Policy looks safe'
    END as risk_assessment
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Check if there are any circular references in policies
SELECT '=== CIRCULAR REFERENCE CHECK ===' as section;
SELECT 
    policyname,
    qual,
    CASE 
        WHEN qual LIKE '%users%' AND qual LIKE '%auth.uid%' THEN '🚨 HIGH RISK - Direct recursion likely'
        WHEN qual LIKE '%users%' THEN '⚠️ MEDIUM RISK - May cause recursion'
        WHEN qual LIKE '%auth.uid%' THEN '⚠️ MEDIUM RISK - May cause recursion'
        ELSE '✅ LOW RISK - No obvious recursion'
    END as recursion_risk
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Check current user authentication status
SELECT '=== AUTHENTICATION STATUS ===' as section;
SELECT 
    current_user as database_user,
    session_user as session_user,
    auth.role() as auth_role,
    CASE 
        WHEN auth.role() = 'authenticated' THEN '✅ User is authenticated'
        ELSE '❌ User is not authenticated'
    END as auth_status;

-- 5. Test basic access to users table
SELECT '=== ACCESS TEST ===' as section;
DO $$
DECLARE
    user_count INTEGER;
    error_message TEXT;
BEGIN
    BEGIN
        -- Try to count users
        SELECT COUNT(*) INTO user_count FROM users LIMIT 1;
        RAISE NOTICE '✅ SUCCESS: Users table accessible, count: %', user_count;
    EXCEPTION
        WHEN OTHERS THEN
            error_message := SQLERRM;
            RAISE NOTICE '❌ ERROR: Cannot access users table - %', error_message;
            
            -- Check if it's a recursion error
            IF error_message LIKE '%infinite recursion%' THEN
                RAISE NOTICE '🚨 CONFIRMED: This is an infinite recursion error!';
                RAISE NOTICE '💡 SOLUTION: Run fix_users_rls_infinite_recursion.sql';
            ELSIF error_message LIKE '%permission denied%' THEN
                RAISE NOTICE '🔒 ISSUE: Permission denied - check RLS policies';
            ELSE
                RAISE NOTICE '❓ UNKNOWN ERROR: %', error_message;
            END IF;
    END;
END $$;

-- 6. Check table structure
SELECT '=== TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 7. Summary and recommendations
SELECT '=== DIAGNOSIS SUMMARY ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'users' 
            AND qual LIKE '%users%'
        ) THEN '🚨 CRITICAL: RLS policies reference users table - causing infinite recursion'
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'users' 
            AND rowsecurity = true
        ) THEN '⚠️ WARNING: RLS is enabled with potentially problematic policies'
        ELSE '✅ GOOD: No obvious recursion issues found'
    END as diagnosis_result;

-- 8. Recommended actions
SELECT '=== RECOMMENDED ACTIONS ===' as section;
SELECT '1. Run fix_users_rls_infinite_recursion.sql for quick fix' as action;
SELECT '2. Or run fix_users_rls_comprehensive.sql for proper role-based access' as action;
SELECT '3. Test User Management page after applying fix' as action;
SELECT '4. Monitor for any remaining errors' as action;

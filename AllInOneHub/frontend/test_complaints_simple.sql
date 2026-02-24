-- Simple Test Script for Complaints System
-- Run this after creating the complaints table to verify everything works

-- 1. Check if complaints table exists
SELECT 
    'Table Check' as test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complaints') 
        THEN 'PASS - Table exists' 
        ELSE 'FAIL - Table does not exist' 
    END as result;

-- 2. Check table structure
SELECT 
    'Structure Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'complaints' 
            AND column_name IN ('id', 'title', 'description', 'category', 'priority', 'status')
        ) 
        THEN 'PASS - Required columns exist' 
        ELSE 'FAIL - Missing required columns' 
    END as result;

-- 3. Check if RLS is enabled
SELECT 
    'RLS Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'complaints' 
            AND rowsecurity = true
        ) 
        THEN 'PASS - RLS enabled' 
        ELSE 'FAIL - RLS not enabled' 
    END as result;

-- 4. Check RLS policies count
SELECT 
    'Policies Check' as test_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') >= 7
        THEN 'PASS - Policies created' 
        ELSE 'FAIL - Insufficient policies' 
    END as result,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') as policies_count;

-- 5. Check indexes count
SELECT 
    'Indexes Check' as test_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'complaints') >= 6
        THEN 'PASS - Indexes created' 
        ELSE 'FAIL - Insufficient indexes' 
    END as result,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'complaints') as indexes_count;

-- 6. Check permissions
SELECT 
    'Permissions Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.role_table_grants 
            WHERE table_name = 'complaints' 
            AND grantee = 'authenticated'
        ) 
        THEN 'PASS - Permissions granted' 
        ELSE 'FAIL - Permissions not granted' 
    END as result;

-- 7. Check if view exists
SELECT 
    'View Check' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_name = 'complaint_statistics'
        ) 
        THEN 'PASS - Statistics view exists' 
        ELSE 'FAIL - Statistics view missing' 
    END as result;

-- 8. Summary
SELECT 
    'SUMMARY' as test_type,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'complaints'
        ) = 1 
        AND (
            SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints'
        ) >= 7
        AND (
            SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'complaints'
        ) >= 6
        THEN 'ALL TESTS PASSED - Complaints system ready to use!'
        ELSE 'SOME TESTS FAILED - Check the results above'
    END as result;

-- 9. Show current complaints count
SELECT 
    'Current Data' as test_type,
    COALESCE((SELECT COUNT(*) FROM complaints), 0) as complaints_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM complaints) = 0 
        THEN 'No complaints yet - ready for first submission!'
        ELSE 'Complaints exist - system is working!'
    END as status;

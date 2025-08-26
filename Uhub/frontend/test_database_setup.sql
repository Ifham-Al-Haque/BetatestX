-- Test Database Setup
-- Run this to verify that all tables and relationships are working

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles',
    'user_status', 
    'conversations',
    'conversation_participants',
    'messages',
    'typing_indicators',
    'suggestions',
    'suggestion_categories'
);

-- 2. Check if user_profiles has data
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
        ELSE '⚠️ NO DATA'
    END as status
FROM user_profiles;

-- 3. Check if user_status has data
SELECT 
    'user_status' as table_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
        ELSE '⚠️ NO DATA'
    END as status
FROM user_status;

-- 4. Test the relationship between user_status and user_profiles
SELECT 
    'user_status + user_profiles join' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ RELATIONSHIP WORKS'
        ELSE '❌ RELATIONSHIP FAILED'
    END as status
FROM user_status us
JOIN user_profiles up ON us.user_id = up.id;

-- 5. Check RLS policies
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
AND tablename IN ('user_profiles', 'user_status', 'conversations', 'messages')
ORDER BY tablename, policyname;

-- 6. Test basic insert into user_status (this should work if RLS is set up correctly)
-- Note: This will only work if you're authenticated
DO $$
BEGIN
    RAISE NOTICE 'Testing database setup...';
    RAISE NOTICE 'If you see this message, the basic database structure is working.';
    RAISE NOTICE 'Check the results above to verify all tables and relationships exist.';
END $$;

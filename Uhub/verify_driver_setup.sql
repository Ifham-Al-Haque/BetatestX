-- =====================================================
-- VERIFY DRIVER MANAGEMENT SYSTEM SETUP
-- Run this script to verify everything is working correctly
-- =====================================================

-- Check if tables exist
SELECT '=== TABLE VERIFICATION ===' as info;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('drivers', 'driver_documents') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('drivers', 'driver_documents');

-- Check table structures
SELECT '=== DRIVERS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DRIVER DOCUMENTS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'driver_documents' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT '=== INDEX VERIFICATION ===' as info;
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname LIKE '%drivers%' OR indexname LIKE '%driver_documents%' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_indexes 
WHERE tablename IN ('drivers', 'driver_documents')
ORDER BY tablename, indexname;

-- Check RLS status
SELECT '=== RLS STATUS ===' as info;
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('drivers', 'driver_documents')
AND schemaname = 'public';

-- Check RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN policyname LIKE '%driver%' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_policies 
WHERE tablename IN ('drivers', 'driver_documents')
ORDER BY tablename, policyname;

-- Check storage buckets
SELECT '=== STORAGE BUCKETS ===' as info;
SELECT 
    id,
    name,
    public,
    file_size_limit,
    CASE 
        WHEN id IN ('driver-profiles', 'driver-documents') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM storage.buckets 
WHERE id IN ('driver-profiles', 'driver-documents');

-- Check sample data
SELECT '=== SAMPLE DATA ===' as info;
SELECT 
    'drivers' as table_name,
    COUNT(*) as record_count
FROM drivers
UNION ALL
SELECT 
    'driver_documents' as table_name,
    COUNT(*) as record_count
FROM driver_documents;

-- Check sample driver details
SELECT '=== SAMPLE DRIVER DETAILS ===' as info;
SELECT 
    full_name,
    employee_id,
    designation,
    team_type,
    shift_type,
    status,
    created_at
FROM drivers
ORDER BY created_at DESC
LIMIT 3;

-- Check sample documents
SELECT '=== SAMPLE DOCUMENTS ===' as info;
SELECT 
    dd.document_type,
    dd.document_url,
    dd.passport_number,
    d.full_name as driver_name
FROM driver_documents dd
JOIN drivers d ON dd.driver_id = d.id
ORDER BY dd.created_at DESC
LIMIT 5;

-- Check triggers
SELECT '=== TRIGGERS ===' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    CASE 
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.triggers 
WHERE event_object_table IN ('drivers', 'driver_documents')
ORDER BY event_object_table, trigger_name;

-- Overall status
SELECT '=== SETUP VERIFICATION COMPLETE ===' as info;

-- Count any missing components
WITH verification AS (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('drivers', 'driver_documents')) as tables_exist,
        (SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('drivers', 'driver_documents') AND rowsecurity) as rls_enabled,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('drivers', 'driver_documents')) as policies_exist,
        (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('driver-profiles', 'driver-documents')) as buckets_exist,
        (SELECT COUNT(*) FROM drivers) as sample_drivers,
        (SELECT COUNT(*) FROM driver_documents) as sample_documents
)
SELECT 
    CASE 
        WHEN tables_exist = 2 THEN '✅ Tables: OK'
        ELSE '❌ Tables: ' || tables_exist || '/2'
    END as tables_status,
    CASE 
        WHEN rls_enabled = 2 THEN '✅ RLS: OK'
        ELSE '❌ RLS: ' || rls_enabled || '/2'
    END as rls_status,
    CASE 
        WHEN policies_exist >= 8 THEN '✅ Policies: OK'
        ELSE '❌ Policies: ' || policies_exist || '/8+'
    END as policies_status,
    CASE 
        WHEN buckets_exist = 2 THEN '✅ Storage: OK'
        ELSE '❌ Storage: ' || buckets_exist || '/2'
    END as storage_status,
    CASE 
        WHEN sample_drivers > 0 THEN '✅ Sample Data: OK'
        ELSE '❌ Sample Data: None'
    END as data_status
FROM verification;

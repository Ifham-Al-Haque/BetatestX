-- =====================================================
-- SIMPLE DATABASE CONNECTION TEST
-- Run this first to check if your database is accessible
-- =====================================================

-- Test 1: Check if you can connect to Supabase
SELECT '✅ Database connection successful!' as status;

-- Test 2: Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('expenses', 'payments', 'upcoming_payments');

-- Test 3: Check table structure
SELECT '=== EXPENSES TABLE COLUMNS ===' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 4: Check if you have data
SELECT '=== DATA COUNT ===' as info;
SELECT 'expenses' as table_name, COUNT(*) as records FROM expenses
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as records FROM payments
UNION ALL
SELECT 'upcoming_payments' as table_name, COUNT(*) as records FROM upcoming_payments;

-- Test 5: Test exact dashboard queries
SELECT '=== TESTING DASHBOARD QUERIES ===' as info;

-- Test expenses query
SELECT 'Testing expenses query...' as test;
SELECT id, title, amount, payment_date, department, category 
FROM expenses 
LIMIT 2;

-- Test payments query  
SELECT 'Testing payments query...' as test;
SELECT id, title, amount, payment_date, due_date, status, department, category
FROM payments 
LIMIT 2;

-- Test 6: Check RLS status
SELECT '=== RLS STATUS ===' as info;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments', 'upcoming_payments');

SELECT '=== TEST COMPLETED ===' as info; 
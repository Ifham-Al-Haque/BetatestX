-- =====================================================
-- CHECK EXPENSES TABLE STRUCTURE
-- Since payments table is empty, let's focus on expenses
-- =====================================================

-- Get expenses table columns
SELECT 'EXPENSES TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample expenses data
SELECT 'SAMPLE EXPENSES DATA:' as info;
SELECT * FROM expenses LIMIT 3;

-- Check if RLS is enabled on expenses
SELECT 'RLS STATUS:' as info;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'expenses';

-- Test a basic expenses query
SELECT 'TESTING EXPENSES QUERY:' as info;
SELECT * FROM expenses LIMIT 2; 
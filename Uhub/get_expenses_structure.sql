-- =====================================================
-- GET EXPENSES TABLE STRUCTURE
-- Now that RLS is disabled, let's see your exact columns
-- =====================================================

-- Get all columns in expenses table
SELECT 'EXPENSES TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data to understand the structure
SELECT 'SAMPLE EXPENSES DATA:' as info;
SELECT * FROM expenses LIMIT 2;

-- Test the exact query the dashboard will use
SELECT 'TESTING DASHBOARD QUERY:' as info;
SELECT * FROM expenses LIMIT 3;

-- Show total count
SELECT 'TOTAL RECORDS:' as info;
SELECT COUNT(*) as total_expenses FROM expenses; 
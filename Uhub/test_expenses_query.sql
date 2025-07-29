-- =====================================================
-- TEST EXPENSES QUERY
-- Let's see what columns you actually have
-- =====================================================

-- Get column names
SELECT 'COLUMN NAMES:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show one record with all data
SELECT 'ONE RECORD:' as info;
SELECT * FROM expenses LIMIT 1;

-- Test basic query
SELECT 'BASIC QUERY:' as info;
SELECT * FROM expenses LIMIT 2; 
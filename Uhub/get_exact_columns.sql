-- =====================================================
-- GET EXACT COLUMN NAMES AND SAMPLE DATA
-- =====================================================

-- Get expenses table columns
SELECT 'EXPENSES COLUMNS:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get payments table columns
SELECT 'PAYMENTS COLUMNS:' as table_info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample expenses data
SELECT 'SAMPLE EXPENSES:' as table_info;
SELECT * FROM expenses LIMIT 1;

-- Show sample payments data
SELECT 'SAMPLE PAYMENTS:' as table_info;
SELECT * FROM payments LIMIT 1;

-- Check data counts
SELECT 'DATA COUNTS:' as table_info;
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as count FROM payments; 
-- =====================================================
-- CHECK EXPENSES TABLE STRUCTURE
-- Let's see what columns you actually have
-- =====================================================

-- Check all columns in expenses table
SELECT '=== EXPENSES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payments table structure too
SELECT '=== PAYMENTS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show sample data to understand the structure
SELECT '=== SAMPLE EXPENSES DATA ===' as info;
SELECT * FROM expenses LIMIT 2;

SELECT '=== SAMPLE PAYMENTS DATA ===' as info;
SELECT * FROM payments LIMIT 2; 
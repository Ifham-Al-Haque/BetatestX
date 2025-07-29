-- Check Dashboard Data Issues
-- Run this in your Supabase SQL editor to diagnose data display problems

-- 1. Check if tables exist
SELECT 
    'expenses' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'payments' as table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments')
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- 2. Check expenses table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'title', 'amount_aed', 'date_paid', 'department', 'service_name')
        THEN '✅ REQUIRED'
        ELSE '📋 OPTIONAL'
    END as importance
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'expenses'
ORDER BY 
    CASE WHEN column_name IN ('id', 'title', 'amount_aed', 'date_paid', 'department', 'service_name') THEN 0 ELSE 1 END,
    column_name;

-- 3. Check data quality
SELECT 
    'Total Records' as metric,
    COUNT(*) as value
FROM expenses
UNION ALL
SELECT 
    'Records with amount_aed' as metric,
    COUNT(*) as value
FROM expenses 
WHERE amount_aed IS NOT NULL AND amount_aed > 0
UNION ALL
SELECT 
    'Records with date_paid' as metric,
    COUNT(*) as value
FROM expenses 
WHERE date_paid IS NOT NULL
UNION ALL
SELECT 
    'Records with department' as metric,
    COUNT(*) as value
FROM expenses 
WHERE department IS NOT NULL AND department != ''
UNION ALL
SELECT 
    'Records with service_name' as metric,
    COUNT(*) as value
FROM expenses 
WHERE service_name IS NOT NULL AND service_name != '';

-- 4. Check unique values for charts
SELECT 
    'Departments' as category,
    COUNT(DISTINCT department) as unique_count,
    STRING_AGG(DISTINCT department, ', ') as values
FROM expenses 
WHERE department IS NOT NULL AND department != ''
UNION ALL
SELECT 
    'Services' as category,
    COUNT(DISTINCT service_name) as unique_count,
    STRING_AGG(DISTINCT service_name, ', ') as values
FROM expenses 
WHERE service_name IS NOT NULL AND service_name != ''
UNION ALL
SELECT 
    'Years' as category,
    COUNT(DISTINCT EXTRACT(YEAR FROM date_paid)) as unique_count,
    STRING_AGG(DISTINCT EXTRACT(YEAR FROM date_paid)::text, ', ') as values
FROM expenses 
WHERE date_paid IS NOT NULL;

-- 5. Check date ranges
SELECT 
    'Date Range' as info,
    MIN(date_paid) as earliest_date,
    MAX(date_paid) as latest_date,
    COUNT(DISTINCT date_paid) as unique_dates
FROM expenses 
WHERE date_paid IS NOT NULL;

-- 6. Check amount ranges
SELECT 
    'Amount Statistics' as info,
    MIN(amount_aed) as min_amount,
    MAX(amount_aed) as max_amount,
    AVG(amount_aed) as avg_amount,
    SUM(amount_aed) as total_amount
FROM expenses 
WHERE amount_aed IS NOT NULL AND amount_aed > 0;

-- 7. Sample data for verification
SELECT 
    'Sample Data' as info,
    id,
    title,
    amount_aed,
    date_paid,
    department,
    service_name
FROM expenses 
ORDER BY date_paid DESC 
LIMIT 5;

-- 8. Check for potential issues
SELECT 
    'Potential Issues' as issue_type,
    COUNT(*) as count,
    'Records with zero or null amounts' as description
FROM expenses 
WHERE amount_aed IS NULL OR amount_aed = 0
UNION ALL
SELECT 
    'Potential Issues' as issue_type,
    COUNT(*) as count,
    'Records with null dates' as description
FROM expenses 
WHERE date_paid IS NULL
UNION ALL
SELECT 
    'Potential Issues' as issue_type,
    COUNT(*) as count,
    'Records with null departments' as description
FROM expenses 
WHERE department IS NULL OR department = ''
UNION ALL
SELECT 
    'Potential Issues' as issue_type,
    COUNT(*) as count,
    'Records with null service names' as description
FROM expenses 
WHERE service_name IS NULL OR service_name = '';

-- 9. Test the exact query the Dashboard uses
SELECT 
    'Dashboard Query Test' as test,
    COUNT(*) as total_records,
    COUNT(CASE WHEN amount_aed IS NOT NULL AND amount_aed > 0 THEN 1 END) as valid_amounts,
    COUNT(CASE WHEN date_paid IS NOT NULL THEN 1 END) as valid_dates,
    COUNT(CASE WHEN department IS NOT NULL AND department != '' THEN 1 END) as valid_departments,
    COUNT(CASE WHEN service_name IS NOT NULL AND service_name != '' THEN 1 END) as valid_services
FROM expenses;

-- 10. Check RLS policies
SELECT 
    'RLS Status' as info,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'expenses';

SELECT 
    'RLS Policies' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'expenses'; 
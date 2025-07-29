-- Check Your Real Data Structure
-- Run this in your Supabase SQL editor to see your actual data

-- 1. Check expenses table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'expenses'
ORDER BY ordinal_position;

-- 2. Check payments table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Show sample expense data (first 5 records)
SELECT * FROM expenses LIMIT 5;

-- 4. Show sample payment data (first 5 records)
SELECT * FROM payments LIMIT 5;

-- 5. Check what columns have data
SELECT 
    'expenses' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as has_title,
    COUNT(CASE WHEN amount IS NOT NULL THEN 1 END) as has_amount,
    COUNT(CASE WHEN amount_aed IS NOT NULL THEN 1 END) as has_amount_aed,
    COUNT(CASE WHEN date_paid IS NOT NULL THEN 1 END) as has_date_paid,
    COUNT(CASE WHEN date IS NOT NULL THEN 1 END) as has_date,
    COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as has_department,
    COUNT(CASE WHEN dept IS NOT NULL THEN 1 END) as has_dept,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as has_category,
    COUNT(CASE WHEN service_name IS NOT NULL THEN 1 END) as has_service_name,
    COUNT(CASE WHEN service IS NOT NULL THEN 1 END) as has_service
FROM expenses
UNION ALL
SELECT 
    'payments' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as has_title,
    COUNT(CASE WHEN amount IS NOT NULL THEN 1 END) as has_amount,
    COUNT(CASE WHEN amount_aed IS NOT NULL THEN 1 END) as has_amount_aed,
    COUNT(CASE WHEN payment_date IS NOT NULL THEN 1 END) as has_payment_date,
    COUNT(CASE WHEN date IS NOT NULL THEN 1 END) as has_date,
    COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as has_department,
    COUNT(CASE WHEN dept IS NOT NULL THEN 1 END) as has_dept,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as has_category,
    COUNT(CASE WHEN service_name IS NOT NULL THEN 1 END) as has_service_name,
    COUNT(CASE WHEN service IS NOT NULL THEN 1 END) as has_service
FROM payments;

-- 6. Check unique values in key columns
SELECT 
    'expenses_departments' as column_name,
    department as value,
    COUNT(*) as count
FROM expenses 
WHERE department IS NOT NULL 
GROUP BY department
UNION ALL
SELECT 
    'expenses_categories' as column_name,
    category as value,
    COUNT(*) as count
FROM expenses 
WHERE category IS NOT NULL 
GROUP BY category
UNION ALL
SELECT 
    'expenses_services' as column_name,
    service_name as value,
    COUNT(*) as count
FROM expenses 
WHERE service_name IS NOT NULL 
GROUP BY service_name;

-- 7. Check date ranges
SELECT 
    'expenses_date_range' as info,
    MIN(date_paid) as earliest_date,
    MAX(date_paid) as latest_date,
    COUNT(DISTINCT date_paid) as unique_dates
FROM expenses 
WHERE date_paid IS NOT NULL
UNION ALL
SELECT 
    'payments_date_range' as info,
    MIN(payment_date) as earliest_date,
    MAX(payment_date) as latest_date,
    COUNT(DISTINCT payment_date) as unique_dates
FROM payments 
WHERE payment_date IS NOT NULL;

-- 8. Test the exact queries the Dashboard uses
SELECT 
    'expenses_query_test' as test,
    COUNT(*) as total_records,
    COUNT(CASE WHEN amount_aed IS NOT NULL THEN 1 END) as has_amount_aed,
    COUNT(CASE WHEN amount IS NOT NULL THEN 1 END) as has_amount,
    COUNT(CASE WHEN date_paid IS NOT NULL THEN 1 END) as has_date_paid,
    COUNT(CASE WHEN date IS NOT NULL THEN 1 END) as has_date,
    COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as has_department
FROM expenses; 
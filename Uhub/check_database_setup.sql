-- Check Database Setup Script
-- Run this in your Supabase SQL editor to verify if tables exist

-- Check if payments table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payments'
        ) THEN '✅ Payments table exists'
        ELSE '❌ Payments table does not exist'
    END as payments_status;

-- Check if expenses table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'expenses'
        ) THEN '✅ Expenses table exists'
        ELSE '❌ Expenses table does not exist'
    END as expenses_status;

-- Check if upcoming_payments table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'upcoming_payments'
        ) THEN '✅ Upcoming_payments table exists'
        ELSE '❌ Upcoming_payments table does not exist'
    END as upcoming_payments_status;

-- Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('payments', 'expenses', 'upcoming_payments')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check if sample data exists
SELECT 
    'payments' as table_name,
    COUNT(*) as record_count
FROM payments
UNION ALL
SELECT 
    'expenses' as table_name,
    COUNT(*) as record_count
FROM expenses
UNION ALL
SELECT 
    'upcoming_payments' as table_name,
    COUNT(*) as record_count
FROM upcoming_payments; 
-- Diagnostic Script for Payments Table Access
-- Run this in your Supabase SQL editor to identify the issue

-- 1. Check if payments table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payments'
        ) THEN '✅ Payments table exists'
        ELSE '❌ Payments table does not exist'
    END as table_status;

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'payments';

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'payments';

-- 5. Check if there's any data
SELECT 
    COUNT(*) as total_records
FROM payments;

-- 6. Show sample data (first 5 records)
SELECT 
    id,
    title,
    amount,
    payment_date,
    due_date,
    status,
    created_at
FROM payments
LIMIT 5;

-- 7. Check for any constraints that might cause issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass;

-- 8. Test a simple query that matches what the Dashboard is trying to do
SELECT 
    'Test Query 1: Simple select' as test_name,
    COUNT(*) as result_count
FROM payments;

-- 9. Test the specific query that's failing
SELECT 
    'Test Query 2: Date filter' as test_name,
    COUNT(*) as result_count
FROM payments
WHERE payment_date <= '2025-07-28'::date
AND status = 'pending';

-- 10. Test the update query that's failing
SELECT 
    'Test Query 3: Update query' as test_name,
    COUNT(*) as records_to_update
FROM payments
WHERE payment_date <= '2025-07-28'::date
AND status = 'pending';

-- 11. Check current user permissions
SELECT 
    current_user as current_user,
    session_user as session_user;

-- 12. Check if the table is accessible to authenticated users
SELECT 
    'RLS Policy Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'payments' 
            AND roles = ARRAY['authenticated']
        ) THEN '✅ Authenticated users have access'
        ELSE '❌ No policy for authenticated users'
    END as policy_status; 
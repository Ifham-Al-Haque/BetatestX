-- Test Your Payments Table Structure
-- Run this in your Supabase SQL editor to see what's wrong

-- 1. Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments')
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as table_status;

-- 2. Show ALL columns in your table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Check if RLS is blocking access
SELECT 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'payments';

-- 4. Show RLS policies (if any)
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'payments';

-- 5. Test basic access
SELECT COUNT(*) as total_records FROM payments;

-- 6. Show first few records
SELECT * FROM payments LIMIT 3;

-- 7. Test the exact query that's failing
SELECT 
    'Testing the failing query' as test,
    COUNT(*) as result
FROM payments 
WHERE payment_date <= '2025-07-28'::date 
AND status = 'pending'; 
-- Fix Payments Table Issues
-- Run this in your Supabase SQL editor to fix common problems

-- 1. Check if table exists and show structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments')
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist - run create_missing_tables.sql first'
    END as table_status;

-- 2. Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'payments';

-- 4. If RLS is enabled, add policies (run these if needed)
-- CREATE POLICY "Enable read access for authenticated users" ON payments
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable insert for authenticated users" ON payments
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Enable update for authenticated users" ON payments
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Test basic access
SELECT COUNT(*) as total_records FROM payments;

-- 6. Show sample data
SELECT * FROM payments LIMIT 3;

-- 7. Test the specific query that's failing
SELECT 
    COUNT(*) as pending_payments_before_date
FROM payments 
WHERE payment_date <= '2025-07-28'::date 
AND status = 'pending'; 
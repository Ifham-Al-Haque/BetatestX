-- Fix Database Access for Real Data
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what's blocking access
SELECT '=== DIAGNOSING ACCESS ISSUES ===' as status;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS is BLOCKING access'
        ELSE '✅ RLS is DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments');

-- Check existing policies
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '📖 Read Policy'
        WHEN cmd = 'INSERT' THEN '➕ Insert Policy'
        WHEN cmd = 'UPDATE' THEN '✏️ Update Policy'
        WHEN cmd = 'DELETE' THEN '🗑️ Delete Policy'
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments');

-- 2. Fix RLS by creating proper policies
-- Uncomment and run this section:

/*
-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON payments;

-- Create proper policies for expenses
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create proper policies for payments
CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON payments
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 3. Alternative: Disable RLS completely (if policies don't work)
-- Uncomment and run this if the above doesn't work:

/*
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
*/

-- 4. Test the exact queries your dashboard uses
SELECT '=== TESTING DASHBOARD QUERIES ===' as status;

-- Test expenses query (exact query from dashboard)
SELECT 
    'Expenses Dashboard Query' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - Data accessible'
        ELSE '❌ FAILED - No data or access blocked'
    END as status
FROM expenses 
WHERE id IS NOT NULL;

-- Test payments query (exact query from dashboard)
SELECT 
    'Payments Dashboard Query' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - Data accessible'
        ELSE '❌ FAILED - No data or access blocked'
    END as status
FROM payments 
WHERE id IS NOT NULL;

-- 5. Show your actual data
SELECT '=== YOUR ACTUAL DATA ===' as status;

SELECT 'Expenses Data:' as data_type, COUNT(*) as total_records FROM expenses;
SELECT 'Payments Data:' as data_type, COUNT(*) as total_records FROM payments;

-- Show sample of your real data
SELECT 'Sample Expenses:' as data_type, title, amount_aed, date_paid, department FROM expenses LIMIT 3;
SELECT 'Sample Payments:' as data_type, title, amount, payment_date, status FROM payments LIMIT 3;

-- 6. Check column names to ensure they match dashboard expectations
SELECT '=== COLUMN STRUCTURE CHECK ===' as status;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
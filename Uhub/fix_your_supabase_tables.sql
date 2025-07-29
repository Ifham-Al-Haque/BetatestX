-- Fix for Your Supabase Database Tables
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as status;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments', 'assets', 'employees', 'tickets');

-- 2. Check existing policies
SELECT '=== EXISTING POLICIES ===' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments', 'assets', 'employees', 'tickets');

-- 3. Fix RLS policies for expenses table
-- Uncomment and run this section:

/*
-- Drop existing policies for expenses
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;

-- Create new policies for expenses
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 4. Fix RLS policies for payments table
-- Uncomment and run this section:

/*
-- Drop existing policies for payments
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON payments;

-- Create new policies for payments
CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON payments
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 5. Alternative: Disable RLS temporarily for testing
-- Uncomment and run this if you want to disable RLS completely:

/*
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
*/

-- 6. Check table structure for expenses
SELECT '=== EXPENSES TABLE STRUCTURE ===' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check table structure for payments
SELECT '=== PAYMENTS TABLE STRUCTURE ===' as status;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Test queries that your dashboard uses
SELECT '=== TESTING DASHBOARD QUERIES ===' as status;

-- Test expenses query
SELECT 
    'Expenses Query Test' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - Data found'
        ELSE '❌ NO DATA - Table empty or access blocked'
    END as status
FROM expenses;

-- Test payments query
SELECT 
    'Payments Query Test' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS - Data found'
        ELSE '❌ NO DATA - Table empty or access blocked'
    END as status
FROM payments;

-- 9. Show sample data if available
SELECT '=== SAMPLE DATA CHECK ===' as status;

SELECT 'Expenses Sample:' as data_type, * FROM expenses LIMIT 3;
SELECT 'Payments Sample:' as data_type, * FROM payments LIMIT 3;

-- 10. Add sample data if tables are empty
-- Uncomment and run this if you need test data:

/*
-- Sample expenses data
INSERT INTO expenses (title, amount_aed, date_paid, department, service_name, vendor, description) VALUES
('Office Supplies', 150.00, '2025-01-15', 'IT', 'Office Supplies', 'OfficeMax', 'Monthly office supplies'),
('Cloud Storage', 300.00, '2025-01-20', 'IT', 'Cloud Services', 'AWS', 'Monthly cloud storage'),
('Software License', 500.00, '2025-01-25', 'IT', 'Software License', 'Microsoft', 'Office365 license'),
('Internet Service', 200.00, '2025-02-01', 'IT', 'Internet', 'Etisalat', 'Monthly internet service'),
('Office Furniture', 800.00, '2025-02-05', 'HR', 'Furniture', 'IKEA', 'New office chairs'),
('Marketing Materials', 400.00, '2025-02-10', 'Marketing', 'Marketing', 'PrintShop', 'Business cards and brochures');

-- Sample payments data
INSERT INTO payments (title, amount, payment_date, due_date, status, description) VALUES
('AWS Renewal', 2500.00, '2025-01-25', '2025-01-25', 'paid', 'Annual AWS infrastructure renewal'),
('Office365 License', 1200.00, '2025-02-22', '2025-02-22', 'paid', 'Monthly Office365 license renewal'),
('Atlassian Subscription', 800.00, '2025-02-28', '2025-02-28', 'paid', 'Quarterly Atlassian tools subscription'),
('Ziwo CRM Payment', 600.00, '2025-03-30', '2025-03-30', 'pending', 'Monthly Ziwo CRM service payment');
*/ 
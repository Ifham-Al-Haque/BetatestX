-- Comprehensive Dashboard Data Fix
-- Run this in your Supabase SQL editor to fix all data loading issues

-- 1. Check current database state
SELECT '=== DATABASE STATUS CHECK ===' as status;

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name)
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as table_status
FROM (VALUES ('expenses'), ('payments'), ('upcoming_payments')) as t(table_name);

-- 2. Create missing tables if they don't exist
-- Uncomment and run this section if tables are missing:

/*
-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount_aed DECIMAL(10,2) NOT NULL,
    date_paid DATE NOT NULL,
    department TEXT,
    service_name TEXT,
    category TEXT,
    vendor TEXT,
    description TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upcoming_payments table
CREATE TABLE IF NOT EXISTS upcoming_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'upcoming',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 3. Fix RLS policies (most common cause of 400 errors)
-- Uncomment and run this section:

/*
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON payments;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON upcoming_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON upcoming_payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON upcoming_payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON upcoming_payments;

-- Create new policies for expenses
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create new policies for payments
CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON payments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create new policies for upcoming_payments
CREATE POLICY "Enable read access for authenticated users" ON upcoming_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON upcoming_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON upcoming_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON upcoming_payments
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 4. Alternative: Disable RLS temporarily for testing
-- Uncomment and run this if you want to disable RLS:

/*
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_payments DISABLE ROW LEVEL SECURITY;
*/

-- 5. Add sample data if tables are empty
-- Uncomment and run this section to add test data:

/*
-- Sample expenses data
INSERT INTO expenses (title, amount_aed, date_paid, department, service_name, vendor, description) VALUES
('Office Supplies', 150.00, '2025-01-15', 'IT', 'Office Supplies', 'OfficeMax', 'Monthly office supplies'),
('Cloud Storage', 300.00, '2025-01-20', 'IT', 'Cloud Services', 'AWS', 'Monthly cloud storage'),
('Software License', 500.00, '2025-01-25', 'IT', 'Software License', 'Microsoft', 'Office365 license'),
('Internet Service', 200.00, '2025-02-01', 'IT', 'Internet', 'Etisalat', 'Monthly internet service'),
('Office Furniture', 800.00, '2025-02-05', 'HR', 'Furniture', 'IKEA', 'New office chairs'),
('Marketing Materials', 400.00, '2025-02-10', 'Marketing', 'Marketing', 'PrintShop', 'Business cards and brochures'),
('Server Maintenance', 1200.00, '2025-02-15', 'IT', 'Maintenance', 'TechCorp', 'Quarterly server maintenance'),
('Training Program', 600.00, '2025-02-20', 'HR', 'Training', 'SkillUp', 'Employee training program'),
('Security Software', 350.00, '2025-03-01', 'IT', 'Security', 'Norton', 'Annual security software'),
('Conference Tickets', 800.00, '2025-03-05', 'Marketing', 'Events', 'TechConf', 'Industry conference tickets');

-- Sample payments data
INSERT INTO payments (title, amount, payment_date, due_date, status, description) VALUES
('AWS Renewal', 2500.00, '2025-01-25', '2025-01-25', 'paid', 'Annual AWS infrastructure renewal'),
('Office365 License', 1200.00, '2025-02-22', '2025-02-22', 'paid', 'Monthly Office365 license renewal'),
('Atlassian Subscription', 800.00, '2025-02-28', '2025-02-28', 'paid', 'Quarterly Atlassian tools subscription'),
('Ziwo CRM Payment', 600.00, '2025-03-30', '2025-03-30', 'pending', 'Monthly Ziwo CRM service payment'),
('Internet Service', 200.00, '2025-04-01', '2025-04-01', 'pending', 'Monthly internet service payment'),
('Office Supplies', 150.00, '2025-04-15', '2025-04-15', 'pending', 'Monthly office supplies'),
('Cloud Storage', 300.00, '2025-04-20', '2025-04-20', 'pending', 'Monthly cloud storage'),
('Software License', 500.00, '2025-04-25', '2025-04-25', 'pending', 'Monthly software license');

-- Sample upcoming_payments data
INSERT INTO upcoming_payments (title, amount, due_date, status, description) VALUES
('AWS Renewal', 2500.00, '2025-07-25', 'upcoming', 'Annual AWS infrastructure renewal'),
('Office365 License Payment', 1200.00, '2025-07-22', 'pending', 'Monthly Office365 license renewal'),
('Atlassian Subscription', 800.00, '2025-07-28', 'upcoming', 'Quarterly Atlassian tools subscription'),
('Ziwo CRM Payment', 600.00, '2025-07-30', 'pending', 'Monthly Ziwo CRM service payment');
*/

-- 6. Test the exact queries that the dashboard uses
SELECT '=== TESTING DASHBOARD QUERIES ===' as status;

-- Test expenses query
SELECT 
    'Expenses Query Test' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS'
        ELSE '❌ NO DATA'
    END as status
FROM expenses 
WHERE id IS NOT NULL;

-- Test payments query
SELECT 
    'Payments Query Test' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS'
        ELSE '❌ NO DATA'
    END as status
FROM payments 
WHERE id IS NOT NULL;

-- Test upcoming_payments query
SELECT 
    'Upcoming Payments Query Test' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCESS'
        ELSE '❌ NO DATA'
    END as status
FROM upcoming_payments 
WHERE id IS NOT NULL;

-- 7. Show sample data
SELECT '=== SAMPLE DATA CHECK ===' as status;

SELECT 'Expenses Sample:' as data_type, title, amount_aed, date_paid, department FROM expenses LIMIT 3;
SELECT 'Payments Sample:' as data_type, title, amount, payment_date, status FROM payments LIMIT 3;
SELECT 'Upcoming Payments Sample:' as data_type, title, amount, due_date, status FROM upcoming_payments LIMIT 3;

-- 8. Check column structure
SELECT '=== COLUMN STRUCTURE CHECK ===' as status;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position; 
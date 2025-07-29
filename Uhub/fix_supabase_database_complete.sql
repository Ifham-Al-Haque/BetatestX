-- =====================================================
-- COMPLETE SUPABASE DATABASE FIX SCRIPT
-- This will fix all issues preventing real data display
-- =====================================================

-- Step 1: Check current table structure
SELECT '=== CHECKING CURRENT TABLE STRUCTURE ===' as info;

-- Check if tables exist
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('expenses', 'payments', 'upcoming_payments', 'employees', 'assets');

-- Check expenses table structure
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

-- Check payments table structure  
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

-- Step 2: Create missing tables if they don't exist
SELECT '=== CREATING MISSING TABLES ===' as info;

-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    department TEXT,
    category TEXT,
    description TEXT,
    vendor TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    department TEXT,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upcoming_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS upcoming_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    department TEXT,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add missing columns to existing tables
SELECT '=== ADDING MISSING COLUMNS ===' as info;

-- Add missing columns to expenses table
DO $$ 
BEGIN
    -- Add amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'amount') THEN
        ALTER TABLE expenses ADD COLUMN amount DECIMAL(10,2);
    END IF;
    
    -- Add payment_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'payment_date') THEN
        ALTER TABLE expenses ADD COLUMN payment_date DATE;
    END IF;
    
    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'department') THEN
        ALTER TABLE expenses ADD COLUMN department TEXT;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'category') THEN
        ALTER TABLE expenses ADD COLUMN category TEXT;
    END IF;
    
    -- Add vendor column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'vendor') THEN
        ALTER TABLE expenses ADD COLUMN vendor TEXT;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'status') THEN
        ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'paid';
    END IF;
END $$;

-- Add missing columns to payments table
DO $$ 
BEGIN
    -- Add payment_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_date') THEN
        ALTER TABLE payments ADD COLUMN payment_date DATE;
    END IF;
    
    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'department') THEN
        ALTER TABLE payments ADD COLUMN department TEXT;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'category') THEN
        ALTER TABLE payments ADD COLUMN category TEXT;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'description') THEN
        ALTER TABLE payments ADD COLUMN description TEXT;
    END IF;
END $$;

-- Step 4: Check and fix RLS (Row Level Security)
SELECT '=== CHECKING RLS STATUS ===' as info;

-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments', 'upcoming_payments', 'employees', 'assets');

-- Check existing RLS policies
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
AND tablename IN ('expenses', 'payments', 'upcoming_payments', 'employees', 'assets');

-- Step 5: Fix RLS - Choose one option:

-- OPTION A: Disable RLS (Quick fix for testing)
SELECT '=== DISABLING RLS FOR TESTING ===' as info;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_payments DISABLE ROW LEVEL SECURITY;

-- OPTION B: Create proper RLS policies (Uncomment if you want RLS enabled)
/*
SELECT '=== CREATING RLS POLICIES ===' as info;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON upcoming_payments;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON upcoming_payments
    FOR SELECT USING (auth.role() = 'authenticated');
*/

-- Step 6: Add sample data if tables are empty
SELECT '=== CHECKING DATA COUNT ===' as info;

-- Check current data counts
SELECT 'expenses' as table_name, COUNT(*) as record_count FROM expenses
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL
SELECT 'upcoming_payments' as table_name, COUNT(*) as record_count FROM upcoming_payments;

-- Add sample data if tables are empty
SELECT '=== ADDING SAMPLE DATA ===' as info;

-- Add sample expenses data
INSERT INTO expenses (title, amount, payment_date, department, category, description, vendor, status) 
SELECT * FROM (VALUES
    ('Office Supplies', 150.00, '2025-01-15', 'IT', 'Office Supplies', 'Monthly office supplies', 'OfficeMax', 'paid'),
    ('Cloud Storage', 300.00, '2025-01-20', 'IT', 'Cloud Services', 'Monthly cloud storage', 'AWS', 'paid'),
    ('Software License', 500.00, '2025-01-25', 'IT', 'Software License', 'Office365 license', 'Microsoft', 'paid'),
    ('Internet Service', 200.00, '2025-02-01', 'IT', 'Internet', 'Monthly internet service', 'Etisalat', 'paid'),
    ('Office Furniture', 800.00, '2025-02-05', 'HR', 'Furniture', 'New office chairs', 'IKEA', 'paid'),
    ('Marketing Materials', 400.00, '2025-02-10', 'Marketing', 'Marketing', 'Business cards and brochures', 'PrintPro', 'paid'),
    ('Atlassian Subscription', 600.00, '2025-02-15', 'IT', 'Software License', 'Quarterly Atlassian tools', 'Atlassian', 'paid'),
    ('Ziwo CRM Payment', 450.00, '2025-02-20', 'IT', 'CRM Services', 'Monthly Ziwo CRM service', 'Ziwo', 'paid'),
    ('AWS Renewal', 2500.00, '2025-02-25', 'IT', 'Cloud Services', 'Annual AWS infrastructure', 'AWS', 'paid'),
    ('Office365 License', 1200.00, '2025-03-01', 'IT', 'Software License', 'Monthly Office365 license', 'Microsoft', 'paid')
) AS v(title, amount, payment_date, department, category, description, vendor, status)
WHERE NOT EXISTS (SELECT 1 FROM expenses LIMIT 1);

-- Add sample payments data
INSERT INTO payments (title, amount, payment_date, due_date, status, department, category, description)
SELECT * FROM (VALUES
    ('AWS Renewal', 2500.00, '2025-01-25', '2025-01-25', 'paid', 'IT', 'Cloud Services', 'Annual AWS infrastructure renewal'),
    ('Office365 License', 1200.00, '2025-02-22', '2025-02-22', 'paid', 'IT', 'Software License', 'Monthly Office365 license renewal'),
    ('Atlassian Subscription', 800.00, '2025-02-28', '2025-02-28', 'paid', 'IT', 'Software License', 'Quarterly Atlassian tools subscription'),
    ('Ziwo CRM Payment', 600.00, '2025-03-30', '2025-03-30', 'pending', 'IT', 'CRM Services', 'Monthly Ziwo CRM service payment'),
    ('Office Supplies', 300.00, '2025-04-15', '2025-04-15', 'pending', 'HR', 'Office Supplies', 'Monthly office supplies'),
    ('Marketing Campaign', 1500.00, '2025-04-20', '2025-04-20', 'pending', 'Marketing', 'Marketing', 'Q2 marketing campaign'),
    ('Internet Service', 400.00, '2025-05-01', '2025-05-01', 'pending', 'IT', 'Internet', 'Monthly internet service'),
    ('Software Licenses', 800.00, '2025-05-15', '2025-05-15', 'pending', 'IT', 'Software License', 'Various software licenses')
) AS v(title, amount, payment_date, due_date, status, department, category, description)
WHERE NOT EXISTS (SELECT 1 FROM payments LIMIT 1);

-- Add sample upcoming payments data
INSERT INTO upcoming_payments (title, amount, due_date, status, department, category, description)
SELECT * FROM (VALUES
    ('AWS Renewal', 2500.00, '2025-04-25', 'pending', 'IT', 'Cloud Services', 'Annual AWS infrastructure renewal'),
    ('Office365 License', 1200.00, '2025-05-22', 'pending', 'IT', 'Software License', 'Monthly Office365 license renewal'),
    ('Atlassian Subscription', 800.00, '2025-05-28', 'pending', 'IT', 'Software License', 'Quarterly Atlassian tools subscription'),
    ('Ziwo CRM Payment', 600.00, '2025-06-30', 'pending', 'IT', 'CRM Services', 'Monthly Ziwo CRM service payment')
) AS v(title, amount, due_date, status, department, category, description)
WHERE NOT EXISTS (SELECT 1 FROM upcoming_payments LIMIT 1);

-- Step 7: Test the exact queries your dashboard uses
SELECT '=== TESTING DASHBOARD QUERIES ===' as info;

-- Test expenses query (exact query from dashboard)
SELECT 'Testing expenses query...' as test;
SELECT id, title, amount, payment_date, department, category 
FROM expenses 
LIMIT 3;

-- Test payments query (exact query from dashboard)
SELECT 'Testing payments query...' as test;
SELECT id, title, amount, payment_date, due_date, status, department, category, description, created_at
FROM payments 
ORDER BY payment_date DESC 
LIMIT 3;

-- Test upcoming payments query
SELECT 'Testing upcoming payments query...' as test;
SELECT * FROM upcoming_payments 
WHERE due_date >= CURRENT_DATE 
AND due_date <= (CURRENT_DATE + INTERVAL '1 month')
ORDER BY due_date ASC;

-- Step 8: Final verification
SELECT '=== FINAL VERIFICATION ===' as info;

-- Show final data counts
SELECT 'expenses' as table_name, COUNT(*) as record_count FROM expenses
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL
SELECT 'upcoming_payments' as table_name, COUNT(*) as record_count FROM upcoming_payments;

-- Show sample data
SELECT 'Sample expenses:' as info;
SELECT title, amount, payment_date, department, category FROM expenses LIMIT 3;

SELECT 'Sample payments:' as info;
SELECT title, amount, payment_date, due_date, status, department FROM payments LIMIT 3;

SELECT '=== SCRIPT COMPLETED ===' as info;
SELECT 'Your database is now ready for real data display!' as success_message; 
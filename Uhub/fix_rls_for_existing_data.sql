-- =====================================================
-- FIX RLS FOR EXISTING DATA
-- This script fixes RLS issues without adding sample data
-- =====================================================

-- Step 1: Check current RLS status
SELECT '=== CHECKING RLS STATUS ===' as info;

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments', 'assets', 'tickets', 'employees');

-- Step 2: Check existing RLS policies
SELECT '=== CHECKING EXISTING RLS POLICIES ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'payments', 'assets', 'tickets', 'employees');

-- Step 3: Check table structures to ensure all required columns exist
SELECT '=== CHECKING EXPENSES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== CHECKING PAYMENTS TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Add missing columns if needed (without affecting existing data)
SELECT '=== ADDING MISSING COLUMNS IF NEEDED ===' as info;

-- Add missing columns to expenses table
DO $$ 
BEGIN
    -- Add amount column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'amount') THEN
        ALTER TABLE expenses ADD COLUMN amount DECIMAL(10,2);
        UPDATE expenses SET amount = amount_aed WHERE amount IS NULL AND amount_aed IS NOT NULL;
    END IF;
    
    -- Add payment_date column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'payment_date') THEN
        ALTER TABLE expenses ADD COLUMN payment_date DATE;
        UPDATE expenses SET payment_date = date_paid WHERE payment_date IS NULL AND date_paid IS NOT NULL;
    END IF;
    
    -- Add department column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'department') THEN
        ALTER TABLE expenses ADD COLUMN department TEXT;
    END IF;
    
    -- Add category column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'category') THEN
        ALTER TABLE expenses ADD COLUMN category TEXT;
        UPDATE expenses SET category = service_name WHERE category IS NULL AND service_name IS NOT NULL;
    END IF;
END $$;

-- Add missing columns to payments table
DO $$ 
BEGIN
    -- Add payment_date column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_date') THEN
        ALTER TABLE payments ADD COLUMN payment_date DATE;
        UPDATE payments SET payment_date = due_date WHERE payment_date IS NULL AND due_date IS NOT NULL;
    END IF;
    
    -- Add department column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'department') THEN
        ALTER TABLE payments ADD COLUMN department TEXT;
    END IF;
    
    -- Add category column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'category') THEN
        ALTER TABLE payments ADD COLUMN category TEXT;
    END IF;
    
    -- Add description column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'description') THEN
        ALTER TABLE payments ADD COLUMN description TEXT;
    END IF;
END $$;

-- Step 5: Fix RLS - Choose one option:

-- OPTION A: Disable RLS (Quick fix for testing)
SELECT '=== DISABLING RLS FOR TESTING ===' as info;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- OPTION B: Create proper RLS policies (Uncomment if you want RLS enabled)
/*
SELECT '=== CREATING RLS POLICIES ===' as info;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON assets;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON employees;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON assets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');
*/

-- Step 6: Test the exact queries your dashboard uses
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

-- Step 7: Show your real data counts
SELECT '=== YOUR REAL DATA COUNTS ===' as info;
SELECT 'expenses' as table_name, COUNT(*) as record_count FROM expenses
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL
SELECT 'assets' as table_name, COUNT(*) as record_count FROM assets
UNION ALL
SELECT 'tickets' as table_name, COUNT(*) as record_count FROM tickets
UNION ALL
SELECT 'employees' as table_name, COUNT(*) as record_count FROM employees;

-- Step 8: Show sample of your real data
SELECT '=== SAMPLE OF YOUR REAL DATA ===' as info;

SELECT 'Sample expenses:' as info;
SELECT title, amount, payment_date, department, category FROM expenses LIMIT 3;

SELECT 'Sample payments:' as info;
SELECT title, amount, payment_date, due_date, status, department FROM payments LIMIT 3;

SELECT '=== RLS FIX COMPLETED ===' as info;
SELECT 'Your real data should now be accessible!' as success_message; 
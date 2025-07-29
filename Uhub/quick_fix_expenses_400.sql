-- Quick Fix for Expenses Table 400 Error
-- Run this in your Supabase SQL editor

-- 1. Check if expenses table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as table_status;

-- 2. If table doesn't exist, create it
-- Uncomment and run this if table doesn't exist:
/*
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 3. Add missing columns if they don't exist
-- Uncomment and run this to add missing columns:
/*
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS amount_aed DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS date_paid DATE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS service_name TEXT;
*/

-- 4. Fix RLS policies (most common cause of 400 errors)
-- Uncomment and run this to fix RLS:
/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 5. Alternative: Disable RLS temporarily for testing
-- Uncomment and run this if you want to disable RLS:
/*
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
*/

-- 6. Add sample data if table is empty
-- Uncomment and run this if you need test data:
/*
INSERT INTO expenses (title, amount_aed, date_paid, department, service_name) VALUES
('Office Supplies', 150.00, '2025-07-01', 'IT', 'Office Supplies'),
('Cloud Storage', 300.00, '2025-07-05', 'IT', 'Cloud Services'),
('Software License', 500.00, '2025-07-10', 'IT', 'Software License'),
('Internet Service', 200.00, '2025-07-15', 'IT', 'Internet'),
('Office Furniture', 800.00, '2025-07-20', 'HR', 'Furniture'),
('Marketing Materials', 400.00, '2025-07-25', 'Marketing', 'Marketing');
*/

-- 7. Test the exact query that's failing
SELECT 
    'Testing exact query' as test,
    COUNT(*) as result
FROM expenses 
WHERE id IS NOT NULL 
AND title IS NOT NULL 
AND amount_aed IS NOT NULL 
AND date_paid IS NOT NULL 
AND department IS NOT NULL;

-- 8. Check current data
SELECT COUNT(*) as total_records FROM expenses;
SELECT * FROM expenses LIMIT 3; 
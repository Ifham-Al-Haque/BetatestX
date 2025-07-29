-- Check and Fix Your Expenses Table
-- Run this in your Supabase SQL editor

-- 1. Check if expenses table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as table_status;

-- 2. Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'expenses'
ORDER BY ordinal_position;

-- 3. Check if RLS is blocking access
SELECT 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'expenses';

-- 4. Show RLS policies (if any)
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'expenses';

-- 5. Check current data
SELECT COUNT(*) as total_records FROM expenses;
SELECT * FROM expenses LIMIT 5;

-- 6. Test the exact query that's failing
SELECT 
    'Testing expenses query' as test,
    COUNT(*) as result
FROM expenses 
WHERE date_paid IS NOT NULL;

-- 7. If table doesn't exist, create it with proper structure
-- Uncomment and run this if table doesn't exist:
/*
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount_aed DECIMAL(10,2) NOT NULL,
    date_paid DATE NOT NULL,
    department TEXT,
    category TEXT,
    description TEXT,
    vendor TEXT,
    payment_method TEXT,
    receipt_url TEXT,
    service_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 8. If table exists but missing columns, add them
-- Uncomment and run this if columns are missing:
/*
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS amount_aed DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS date_paid DATE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS vendor TEXT,
ADD COLUMN IF NOT EXISTS service_name TEXT;
*/

-- 9. Add RLS policies if needed
-- Uncomment and run this if RLS is blocking access:
/*
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');
*/

-- 10. Add sample data if table is empty
-- Uncomment and run this if you need test data:
/*
INSERT INTO expenses (title, amount_aed, date_paid, department, category, vendor, service_name) VALUES
('Office Supplies', 150.00, '2025-07-01', 'IT', 'Office Supplies', 'Office Depot', 'Office Supplies'),
('Cloud Storage', 300.00, '2025-07-05', 'IT', 'Cloud Services', 'Google Cloud', 'Cloud Services'),
('Software License', 500.00, '2025-07-10', 'IT', 'Software License', 'JetBrains', 'Software License'),
('Internet Service', 200.00, '2025-07-15', 'IT', 'Utilities', 'Etisalat', 'Internet'),
('Office Furniture', 800.00, '2025-07-20', 'HR', 'Furniture', 'IKEA', 'Furniture'),
('Marketing Materials', 400.00, '2025-07-25', 'Marketing', 'Marketing', 'Print Shop', 'Marketing'),
('AWS Services', 1200.00, '2025-08-01', 'IT', 'Cloud Services', 'Amazon Web Services', 'Cloud Services'),
('Adobe License', 600.00, '2025-08-05', 'Marketing', 'Software License', 'Adobe', 'Software License'),
('Office Rent', 5000.00, '2025-08-10', 'Finance', 'Rent', 'Property Management', 'Rent'),
('Electricity Bill', 300.00, '2025-08-15', 'Finance', 'Utilities', 'DEWA', 'Utilities');
*/ 
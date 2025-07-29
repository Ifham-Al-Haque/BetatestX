-- Fix Payments Table 400 Error
-- Run this in your Supabase SQL editor

-- 1. Check if payments table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments')
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
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'payments';

-- 4. Show existing RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'payments';

-- 5. Check current data
SELECT COUNT(*) as total_records FROM payments;
SELECT * FROM payments LIMIT 3;

-- 6. Test basic access
SELECT 
    'Testing basic access' as test,
    COUNT(*) as result
FROM payments;

-- 7. If table doesn't exist, create it
-- Uncomment and run this if table doesn't exist:
/*
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    description TEXT,
    category TEXT,
    vendor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- 8. If table exists but missing columns, add them
-- Uncomment and run this if columns are missing:
/*
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS vendor TEXT;
*/

-- 9. Fix RLS policies (most common cause of 400 errors)
-- Uncomment and run this to fix RLS:
/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON payments;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON payments
    FOR DELETE USING (auth.role() = 'authenticated');
*/

-- 10. Alternative: Disable RLS temporarily for testing
-- Uncomment and run this if you want to disable RLS:
/*
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
*/

-- 11. Add sample data if table is empty
-- Uncomment and run this if you need test data:
/*
INSERT INTO payments (title, amount, payment_date, due_date, status, category, vendor) VALUES
('AWS Cloud Services', 1500.00, '2025-07-15', '2025-07-15', 'paid', 'Cloud Services', 'Amazon Web Services'),
('Office 365 License', 800.00, '2025-07-20', '2025-07-20', 'paid', 'Software License', 'Microsoft'),
('Internet Service', 200.00, '2025-07-25', '2025-07-25', 'pending', 'Utilities', 'Etisalat'),
('Software License Renewal', 1200.00, '2025-08-01', '2025-08-01', 'pending', 'Software License', 'Adobe'),
('Office Rent', 5000.00, '2025-08-10', '2025-08-10', 'pending', 'Rent', 'Property Management'),
('Electricity Bill', 300.00, '2025-08-15', '2025-08-15', 'pending', 'Utilities', 'DEWA');
*/

-- 12. Test the exact query that's failing
SELECT 
    'Testing exact query' as test,
    COUNT(*) as result
FROM payments 
WHERE payment_date <= '2025-07-28'::date 
AND status = 'pending';

-- 13. Check for data type issues
SELECT 
    'Checking data types' as test,
    COUNT(*) as records_with_valid_dates
FROM payments 
WHERE payment_date IS NOT NULL 
AND payment_date::text ~ '^\d{4}-\d{2}-\d{2}$';

-- 14. Final verification
SELECT 
    'Final verification' as test,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count
FROM payments; 
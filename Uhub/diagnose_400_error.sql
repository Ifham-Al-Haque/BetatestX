-- Quick Diagnostic for 400 Error
-- Run this in your Supabase SQL editor

-- 1. Check if expenses table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as table_status;

-- 2. Check if the specific columns exist
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'title', 'amount_aed', 'date_paid', 'department') 
        THEN '✅ Required column'
        ELSE '❌ Missing required column'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'expenses' 
AND column_name IN ('id', 'title', 'amount_aed', 'date_paid', 'department')
ORDER BY column_name;

-- 3. Check RLS status
SELECT 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'expenses';

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'expenses';

-- 5. Test the exact query that's failing
SELECT 
    'Testing exact query' as test,
    COUNT(*) as result
FROM expenses 
WHERE id IS NOT NULL 
AND title IS NOT NULL 
AND amount_aed IS NOT NULL 
AND date_paid IS NOT NULL 
AND department IS NOT NULL;

-- 6. Check if you have any data
SELECT COUNT(*) as total_records FROM expenses;

-- 7. Show sample data structure
SELECT * FROM expenses LIMIT 1; 
-- Test Script for Complaints System Setup
-- Run this after creating the complaints table to verify everything works

-- 1. Check if table exists
SELECT 
    table_name,
    table_type,
    is_insertable_into,
    is_typed
FROM information_schema.tables 
WHERE table_name = 'complaints';

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'complaints'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'complaints';

-- 4. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'complaints';

-- 5. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'complaints';

-- 6. Check permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'complaints';

-- 7. Test insert (this should work for authenticated users)
-- Note: You need to be logged in as a user to test this
INSERT INTO complaints (
    title,
    description,
    category,
    priority,
    complainant_id,
    complainant_name
) VALUES (
    'Test Complaint',
    'This is a test complaint to verify the system works',
    'Other',
    'low',
    auth.uid(),
    'Test User'
) RETURNING *;

-- 8. Check if test data was inserted
SELECT * FROM complaints WHERE title = 'Test Complaint';

-- 9. Clean up test data
DELETE FROM complaints WHERE title = 'Test Complaint';

-- 10. Verify cleanup
SELECT COUNT(*) as remaining_complaints FROM complaints;

-- Expected Results:
-- 1. Table should exist and be insertable
-- 2. Should have all required columns with correct types
-- 3. RLS should be enabled (rowsecurity = true)
-- 4. Should have RLS policies for different user roles
-- 5. Should have indexes for performance
-- 6. Should have proper permissions for authenticated users
-- 7. Insert should work for authenticated users
-- 8. Test data should be visible
-- 9. Cleanup should work
-- 10. Count should be 0 after cleanup

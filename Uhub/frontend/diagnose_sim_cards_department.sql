-- Diagnostic Script for SIM Cards Department Issue
-- Run this in your Supabase SQL Editor to understand the current state

-- 1. Check what departments currently exist in the table
SELECT 'Current departments in sim_cards table:' as info;
SELECT DISTINCT department, COUNT(*) as count 
FROM sim_cards 
GROUP BY department 
ORDER BY department;

-- 2. Check if the constraint exists and what it allows
SELECT 'Current constraint definition:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'sim_cards_department_check';

-- 3. Check table structure
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sim_cards' 
ORDER BY ordinal_position;

-- 4. Check all constraints on the table
SELECT 'All constraints on sim_cards table:' as info;
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'sim_cards'::regclass;

-- 5. Try to see what values are currently allowed
SELECT 'Sample of current data:' as info;
SELECT id, sim_number, department, status 
FROM sim_cards 
LIMIT 5;

-- 6. Test what happens when we try to insert with different values
-- (This will help identify the exact constraint issue)
SELECT 'Testing constraint with different values:' as info;

-- Try to see what the constraint actually allows
-- Run these one by one to see which ones fail:

-- Test 1: Try with 'IT' (should work if constraint allows it)
-- INSERT INTO sim_cards (sim_number, package_name, department, status) 
-- VALUES ('TEST001', 'Test Package', 'IT', 'Active');

-- Test 2: Try with 'TECHNOLOGY' (this is what's failing)
-- INSERT INTO sim_cards (sim_number, package_name, department, status) 
-- VALUES ('TEST002', 'Test Package', 'TECHNOLOGY', 'Active');

-- Test 3: Try with 'Customer Service'
-- INSERT INTO sim_cards (sim_number, package_name, department, status) 
-- VALUES ('TEST003', 'Test Package', 'Customer Service', 'Active');

-- Note: Comment out the INSERT statements above and run them one by one
-- to see which department values are actually allowed by the constraint

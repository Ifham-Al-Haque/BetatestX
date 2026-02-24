-- Fix SIM Cards Department Constraint
-- This script updates the sim_cards table to allow the new department values
-- Run this in your Supabase SQL Editor

-- First, let's see what the current constraint looks like
-- You can run this to check the current constraint:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'sim_cards_department_check';

-- First, let's see what departments currently exist in the table
SELECT DISTINCT department FROM sim_cards ORDER BY department;

-- 1. Update existing records to use the new department values FIRST
-- This maps old values to new ones BEFORE changing the constraint
UPDATE sim_cards SET department = 'TECHNOLOGY' WHERE department = 'IT';
UPDATE sim_cards SET department = 'CUSTOMER_SERVICE' WHERE department = 'Customer Service';
UPDATE sim_cards SET department = 'OPERATION' WHERE department = 'Operations';
UPDATE sim_cards SET department = 'OTHERS' WHERE department = 'Other';

-- 2. Now drop the existing constraint
ALTER TABLE sim_cards DROP CONSTRAINT IF EXISTS sim_cards_department_check;

-- 3. Create a new constraint that allows our new department values
ALTER TABLE sim_cards ADD CONSTRAINT sim_cards_department_check 
CHECK (department IN (
  'TECHNOLOGY',
  'HR', 
  'CUSTOMER_SERVICE',
  'MARKETING',
  'FINANCE',
  'MANAGEMENT',
  'OPERATION',
  'OTHERS'
));

-- 4. Verify the constraint was applied
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'sim_cards_department_check';

-- 5. Test with a sample insert
-- INSERT INTO sim_cards (sim_number, package_name, department, status) 
-- VALUES ('TEST001', 'Test Package', 'TECHNOLOGY', 'Active');

-- Alternative approach if you want to be more flexible:
-- Instead of the specific constraint above, you can use this more flexible one:
-- ALTER TABLE sim_cards ADD CONSTRAINT sim_cards_department_check CHECK (department IS NOT NULL AND department != '');

-- Note: If you still get errors, you might need to check:
-- 1. The exact table structure: \d sim_cards
-- 2. Any other constraints: SELECT * FROM information_schema.table_constraints WHERE table_name = 'sim_cards';
-- 3. The current data types: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sim_cards';

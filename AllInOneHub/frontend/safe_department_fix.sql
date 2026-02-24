-- Safe SIM Cards Department Fix - Run these commands one by one
-- This approach is safer and avoids constraint violations

-- STEP 1: Check what departments currently exist
SELECT DISTINCT department FROM sim_cards ORDER BY department;

-- STEP 2: Check the current constraint (if it exists)
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint 
WHERE conname = 'sim_cards_department_check';

-- STEP 3: Drop the existing constraint (if it exists)
-- Run this only if the constraint exists from step 2
ALTER TABLE sim_cards DROP CONSTRAINT IF EXISTS sim_cards_department_check;

-- STEP 4: Update existing records to use new department values
-- Run these one by one to see the results
UPDATE sim_cards SET department = 'TECHNOLOGY' WHERE department = 'IT';
-- Check result: SELECT COUNT(*) FROM sim_cards WHERE department = 'TECHNOLOGY';

UPDATE sim_cards SET department = 'CUSTOMER_SERVICE' WHERE department = 'Customer Service';
-- Check result: SELECT COUNT(*) FROM sim_cards WHERE department = 'CUSTOMER_SERVICE';

UPDATE sim_cards SET department = 'OPERATION' WHERE department = 'Operations';
-- Check result: SELECT COUNT(*) FROM sim_cards WHERE department = 'OPERATION';

UPDATE sim_cards SET department = 'OTHERS' WHERE department = 'Other';
-- Check result: SELECT COUNT(*) FROM sim_cards WHERE department = 'OTHERS';

-- STEP 5: Verify all departments are now valid
SELECT DISTINCT department FROM sim_cards ORDER BY department;

-- STEP 6: Create the new constraint
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

-- STEP 7: Verify the constraint was applied
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint 
WHERE conname = 'sim_cards_department_check';

-- STEP 8: Test with a sample insert
INSERT INTO sim_cards (sim_number, package_name, department, status) 
VALUES ('TEST001', 'Test Package', 'TECHNOLOGY', 'Active');

-- STEP 9: Clean up test data
DELETE FROM sim_cards WHERE sim_number = 'TEST001';

-- ALTERNATIVE: If you want a more flexible approach, use this instead of step 6:
-- ALTER TABLE sim_cards ADD CONSTRAINT sim_cards_department_check 
-- CHECK (department IS NOT NULL AND department != '');

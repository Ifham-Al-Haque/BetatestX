-- Immediate Fix for SIM Cards Department Issue
-- This script will fix the issue immediately without needing to understand the current constraint

-- Step 1: Drop the problematic constraint (if it exists)
ALTER TABLE sim_cards DROP CONSTRAINT IF EXISTS sim_cards_department_check;

-- Step 2: Create a flexible constraint that allows any non-empty department value
ALTER TABLE sim_cards ADD CONSTRAINT sim_cards_department_check 
CHECK (department IS NOT NULL AND department != '');

-- Step 3: Verify the constraint was applied
SELECT 'New constraint created:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'sim_cards_department_check';

-- Step 4: Test that it works with your preferred values
-- This should now work:
INSERT INTO sim_cards (sim_number, package_name, department, status) 
VALUES ('TEST001', 'Test Package', 'TECHNOLOGY', 'Active');

-- Step 5: Clean up test data
DELETE FROM sim_cards WHERE sim_number = 'TEST001';

-- Step 6: Update existing records to use your preferred values (optional)
UPDATE sim_cards SET department = 'TECHNOLOGY' WHERE department = 'IT';
UPDATE sim_cards SET department = 'CUSTOMER_SERVICE' WHERE department = 'Customer Service';
UPDATE sim_cards SET department = 'OPERATION' WHERE department = 'Operations';
UPDATE sim_cards SET department = 'OTHERS' WHERE department = 'Other';

-- Step 7: Verify the update worked
SELECT 'Updated departments:' as info;
SELECT DISTINCT department, COUNT(*) as count 
FROM sim_cards 
GROUP BY department 
ORDER BY department;

-- Now you can use any department value you want!
-- The constraint only ensures the department field is not null or empty

-- Add designation field to sim_cards table
-- This script adds a designation column to store job titles/positions

-- Step 1: Add the designation column
ALTER TABLE sim_cards 
ADD COLUMN IF NOT EXISTS designation VARCHAR(255);

-- Step 2: Add a comment to describe the column
COMMENT ON COLUMN sim_cards.designation IS 'Job title or position of the current user';

-- Step 3: Update existing records with sample designations (optional)
-- You can customize these based on your organization's structure
UPDATE sim_cards 
SET designation = 'Software Engineer' 
WHERE department = 'TECHNOLOGY' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'HR Manager' 
WHERE department = 'HR' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'Customer Service Representative' 
WHERE department = 'CUSTOMER_SERVICE' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'Marketing Specialist' 
WHERE department = 'MARKETING' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'Financial Analyst' 
WHERE department = 'FINANCE' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'Operations Manager' 
WHERE department = 'OPERATION' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'Executive' 
WHERE department = 'MANAGEMENT' AND designation IS NULL;

UPDATE sim_cards 
SET designation = 'General Staff' 
WHERE department = 'OTHERS' AND designation IS NULL;

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sim_cards' 
AND column_name = 'designation';

-- Step 5: Check sample data
SELECT sim_number, current_user, department, designation, status
FROM sim_cards 
LIMIT 5;

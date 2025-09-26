-- Simple test to create the table and verify it exists
-- Run this in Supabase SQL Editor

-- Step 1: Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS employee_offboarding_records CASCADE;

-- Step 2: Create the table
CREATE TABLE employee_offboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID,
    last_working_date DATE NOT NULL,
    termination_date DATE,
    reason_for_leaving VARCHAR(100),
    reason_details TEXT,
    status VARCHAR(50) DEFAULT 'in_progress',
    progress_percentage INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Verify table exists
SELECT 'Table created successfully!' as message;

-- Step 4: Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'employee_offboarding_records'
ORDER BY ordinal_position;

-- Step 5: Insert a test record
INSERT INTO employee_offboarding_records (employee_id, last_working_date, reason_for_leaving)
VALUES ('00000000-0000-0000-0000-000000000000', '2024-01-15', 'Test record');

-- Step 6: Verify test record was inserted
SELECT COUNT(*) as test_records FROM employee_offboarding_records;

-- Fix Employees Table - Add Missing Status Column
-- Run this in your Supabase SQL Editor to fix the missing status column

-- 1. Check if status column exists, if not add it
DO $$
BEGIN
    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'status'
    ) THEN
        -- Add the status column with proper constraints
        ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'pending', 'terminated'));
        
        RAISE NOTICE 'Status column added to employees table';
    ELSE
        RAISE NOTICE 'Status column already exists in employees table';
    END IF;
END $$;

-- 2. Create index for status column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- 3. Add comment for documentation
COMMENT ON COLUMN employees.status IS 'Current status of the employee (active, inactive, pending, terminated)';

-- 4. Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'status';

-- Add Employee Archive Feature
-- This migration adds support for archiving employees who are no longer working

-- 1. Add is_archived column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 2. Add archived_at timestamp column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 3. Add archived_by column to track who archived the employee
ALTER TABLE employees ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Create index for better query performance on archived employees
CREATE INDEX IF NOT EXISTS idx_employees_is_archived ON employees(is_archived);
CREATE INDEX IF NOT EXISTS idx_employees_archived_at ON employees(archived_at);

-- 5. Add comment for documentation
COMMENT ON COLUMN employees.is_archived IS 'Indicates if the employee has been archived (no longer working)';
COMMENT ON COLUMN employees.archived_at IS 'Timestamp when the employee was archived';
COMMENT ON COLUMN employees.archived_by IS 'User ID of the person who archived the employee';

-- 6. Create a function to archive an employee
CREATE OR REPLACE FUNCTION archive_employee(employee_uuid UUID, archived_by_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE employees
    SET 
        is_archived = TRUE,
        archived_at = NOW(),
        archived_by = archived_by_uuid,
        status = 'terminated',
        updated_at = NOW()
    WHERE id = employee_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a function to unarchive an employee
CREATE OR REPLACE FUNCTION unarchive_employee(employee_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE employees
    SET 
        is_archived = FALSE,
        archived_at = NULL,
        archived_by = NULL,
        status = 'active',
        updated_at = NOW()
    WHERE id = employee_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Employee archive feature added successfully!';
    RAISE NOTICE 'You can now archive employees from the Employee Records page.';
    RAISE NOTICE 'Archived employees will appear in the Employee History section.';
END $$;

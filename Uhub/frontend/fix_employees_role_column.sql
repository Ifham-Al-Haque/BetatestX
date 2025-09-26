-- Fix Employees Table Role Column Issue
-- This script addresses the "Could not find the 'role' column of 'employees'" error

-- Step 1: Check current employees table structure
SELECT 
    'Current Employees Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- Step 2: Check if role column exists in employees table
SELECT 
    'Role Column Check' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'role'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Step 3: Add role column to employees table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE employees ADD COLUMN role VARCHAR(50) DEFAULT 'employee';
        RAISE NOTICE '✅ Role column added to employees table with default value "employee"';
    ELSE
        RAISE NOTICE '✅ Role column already exists in employees table';
    END IF;
END $$;

-- Step 4: Add check constraint for role values
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
    CHECK (role IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer', 'operation_manager', 'subscribe_now'));

-- Step 5: Update existing records that might have NULL role values
UPDATE employees 
SET role = 'employee' 
WHERE role IS NULL;

-- Step 6: Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- Step 7: Verify the fix
SELECT 
    'Final Verification' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'role';

-- Step 8: Test query to ensure role column works
SELECT 
    'Role Column Test' as test_name,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN role = 'employee' THEN 1 END) as employee_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'hr_manager' THEN 1 END) as hr_manager_count,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_count
FROM employees;

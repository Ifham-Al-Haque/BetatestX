-- Comprehensive Employees Table Check and Fix
-- Run this in your Supabase SQL Editor to diagnose and fix employees table issues

-- 1. Check current table structure
SELECT 
    'Current Employees Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 2. Check if status column exists and add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'pending', 'terminated'));
        RAISE NOTICE '✅ Status column added to employees table';
    ELSE
        RAISE NOTICE '✅ Status column already exists in employees table';
    END IF;
END $$;

-- 3. Ensure all required columns exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Add array columns if they don't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS responsibilities TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS duties TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS access_list TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS asset_list TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS key_roles TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS extra_responsibilities TEXT[] DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS key_roles_detailed TEXT[] DEFAULT '{}';

-- 5. Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);

-- 6. Add constraints
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
    CHECK (status IN ('active', 'inactive', 'pending', 'terminated'));

-- 7. Add unique constraints if they don't exist
DO $$
BEGIN
    -- Add unique constraint for email if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_name = 'employees_email_key'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_email_key UNIQUE (email);
        RAISE NOTICE '✅ Email unique constraint added';
    END IF;
    
    -- Add unique constraint for employee_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_name = 'employees_employee_id_key'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);
        RAISE NOTICE '✅ Employee ID unique constraint added';
    END IF;
END $$;

-- 8. Final verification
SELECT 
    'Final Employees Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 9. Test query to ensure status column works
SELECT 
    'Status Column Test' as test_name,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_employees,
    COUNT(CASE WHEN status = 'terminated' THEN 1 END) as terminated_employees
FROM employees;

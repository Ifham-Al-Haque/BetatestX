-- Fix Employees Table Structure for Uhub Frontend
-- Run this in your Supabase SQL Editor to fix existing table issues

-- 1. Check if create_at column exists and rename it (only if needed)
DO $$
BEGIN
    -- Check if create_at exists AND created_at doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'create_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE employees RENAME COLUMN create_at TO created_at;
        RAISE NOTICE 'Renamed create_at to created_at';
    ELSE
        RAISE NOTICE 'Either create_at does not exist or created_at already exists, skipping rename';
    END IF;
END $$;

-- 2. Add missing columns if they don't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- 3. Add unique constraints for email and employee_id
-- First, drop existing constraints if they exist
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_key;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_id_key;

-- Add unique constraints
ALTER TABLE employees ADD CONSTRAINT employees_email_key UNIQUE (email);
ALTER TABLE employees ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);

-- 4. Add check constraints for status
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check;
ALTER TABLE employees ADD CONSTRAINT employees_status_check 
    CHECK (status IN ('active', 'inactive', 'pending', 'terminated'));

-- 5. Ensure proper data types for JSONB fields
-- Convert any existing text fields to JSONB if they're not already
DO $$
BEGIN
    -- Check if key_roles is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'key_roles' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN key_roles TYPE JSONB USING 
            CASE 
                WHEN key_roles IS NULL OR key_roles = '' THEN '[]'::jsonb
                ELSE key_roles::jsonb
            END;
    END IF;

    -- Check if extra_responsibilities is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'extra_responsibilities' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN extra_responsibilities TYPE JSONB USING 
            CASE 
                WHEN extra_responsibilities IS NULL OR extra_responsibilities = '' THEN '[]'::jsonb
                ELSE extra_responsibilities::jsonb
            END;
    END IF;

    -- Check if access_list is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'access_list' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN access_list TYPE JSONB USING 
            CASE 
                WHEN access_list IS NULL OR access_list = '' THEN '[]'::jsonb
                ELSE access_list::jsonb
            END;
    END IF;

    -- Check if assets is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'assets' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN assets TYPE JSONB USING 
            CASE 
                WHEN assets IS NULL OR assets = '' THEN '[]'::jsonb
                ELSE assets::jsonb
            END;
    END IF;

    -- Check if asset_list is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'asset_list' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN asset_list TYPE JSONB USING 
            CASE 
                WHEN asset_list IS NULL OR asset_list = '' THEN '[]'::jsonb
                ELSE asset_list::jsonb
            END;
    END IF;

    -- Check if key_roles_detailed is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'key_roles_detailed' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN key_roles_detailed TYPE JSONB USING 
            CASE 
                WHEN key_roles_detailed IS NULL OR key_roles_detailed = '' THEN '[]'::jsonb
                ELSE key_roles_detailed::jsonb
            END;
    END IF;

    -- Check if scopes is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'scopes' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN scopes TYPE JSONB USING 
            CASE 
                WHEN scopes IS NULL OR scopes = '' THEN '[]'::jsonb
                ELSE scopes::jsonb
            END;
    END IF;

    -- Check if responsibilities is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'responsibilities' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN responsibilities TYPE JSONB USING 
            CASE 
                WHEN responsibilities IS NULL OR responsibilities = '' THEN '[]'::jsonb
                ELSE responsibilities::jsonb
            END;
    END IF;

    -- Check if duties is text and convert to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'duties' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE employees ALTER COLUMN duties TYPE JSONB USING 
            CASE 
                WHEN duties IS NULL OR duties = '' THEN '[]'::jsonb
                ELSE duties::jsonb
            END;
    END IF;
END $$;

-- 6. Set default values for JSONB fields if they're NULL
UPDATE employees SET key_roles = '[]'::jsonb WHERE key_roles IS NULL;
UPDATE employees SET extra_responsibilities = '[]'::jsonb WHERE extra_responsibilities IS NULL;
UPDATE employees SET access_list = '[]'::jsonb WHERE access_list IS NULL;
UPDATE employees SET assets = '[]'::jsonb WHERE assets IS NULL;
UPDATE employees SET asset_list = '[]'::jsonb WHERE asset_list IS NULL;
UPDATE employees SET key_roles_detailed = '[]'::jsonb WHERE key_roles_detailed IS NULL;
UPDATE employees SET scopes = '[]'::jsonb WHERE scopes IS NULL;
UPDATE employees SET responsibilities = '[]'::jsonb WHERE responsibilities IS NULL;
UPDATE employees SET duties = '[]'::jsonb WHERE duties IS NULL;

-- 7. Ensure Row Level Security is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

-- 9. Create proper RLS policies
-- Policy for viewing employees (all authenticated users can view)
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting employees (all authenticated users can insert)
CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating employees (users can update their own record, admins can update all)
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Policy for deleting employees (only admins and HR managers can delete)
CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);

-- 11. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_employees_updated_at ON employees;
CREATE TRIGGER trigger_update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON employees TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Employees table structure fixed successfully!';
    RAISE NOTICE 'All required fields and constraints are now in place.';
    RAISE NOTICE 'You can now add employees through the Employee Record page.';
END $$;

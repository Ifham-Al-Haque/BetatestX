-- Create Employees Table for Uhub Frontend
-- Run this in your Supabase SQL Editor

-- 1. Create the base employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    designation VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    reporting_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reporting_manager VARCHAR(255),
    hire_date DATE,
    location VARCHAR(100),
    scopes TEXT[] DEFAULT '{}',
    responsibilities TEXT[] DEFAULT '{}',
    duties TEXT[] DEFAULT '{}',
    access_list TEXT[] DEFAULT '{}',
    asset_list TEXT[] DEFAULT '{}',
    profile_picture TEXT,
    photo_url TEXT,
    summary TEXT,
    key_roles TEXT[] DEFAULT '{}',
    extra_responsibilities TEXT[] DEFAULT '{}',
    key_roles_detailed TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'terminated')),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
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

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);

-- 5. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON employees TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Add comments for documentation
COMMENT ON TABLE employees IS 'Stores employee information and records';
COMMENT ON COLUMN employees.id IS 'Unique identifier for the employee';
COMMENT ON COLUMN employees.full_name IS 'Full name of the employee';
COMMENT ON COLUMN employees.email IS 'Email address of the employee (unique)';
COMMENT ON COLUMN employees.employee_id IS 'Employee ID number (unique)';
COMMENT ON COLUMN employees.role IS 'Role of the employee in the system';
COMMENT ON COLUMN employees.status IS 'Current status of the employee';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Employees table created successfully!';
    RAISE NOTICE 'You can now add employees through the Employee Record page.';
END $$;

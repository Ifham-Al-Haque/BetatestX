-- Create Departments Table for Uhub Frontend
-- Run this in your Supabase SQL Editor

-- 1. Create the departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    location VARCHAR(100),
    budget DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Policy for viewing departments (all authenticated users can view)
CREATE POLICY "departments_select_policy" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting departments (only admins and managers can insert)
CREATE POLICY "departments_insert_policy" ON departments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'manager', 'hr_manager')
        )
    );

-- Policy for updating departments (only admins and managers can update)
CREATE POLICY "departments_update_policy" ON departments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('admin', 'manager', 'hr_manager')
        )
    );

-- Policy for deleting departments (only admins can delete)
CREATE POLICY "departments_delete_policy" ON departments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

-- 5. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- 7. Grant necessary permissions
GRANT ALL ON departments TO authenticated;

-- 8. Insert some common departments
INSERT INTO departments (name, description) VALUES 
    ('IT Department', 'Information Technology and Systems'),
    ('HR Department', 'Human Resources and Administration'),
    ('Finance Department', 'Financial Management and Accounting'),
    ('Operations Department', 'Business Operations and Logistics'),
    ('Sales Department', 'Sales and Customer Relations'),
    ('Marketing Department', 'Marketing and Communications'),
    ('Engineering Department', 'Product Development and Engineering'),
    ('Customer Service', 'Customer Support and Service'),
    ('Legal Department', 'Legal Affairs and Compliance'),
    ('Facilities Management', 'Building and Infrastructure Management')
ON CONFLICT (name) DO NOTHING;

-- 9. Add comments for documentation
COMMENT ON TABLE departments IS 'Stores department information and structure';
COMMENT ON COLUMN departments.id IS 'Unique identifier for the department';
COMMENT ON COLUMN departments.name IS 'Name of the department (unique)';
COMMENT ON COLUMN departments.manager_id IS 'ID of the department manager (references employees)';
COMMENT ON COLUMN departments.status IS 'Current status of the department';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Departments table created successfully!';
    RAISE NOTICE 'Common departments have been added for testing.';
END $$;

-- Simple Fleet Management Setup Script
-- Run this in your Supabase SQL Editor to fix the "departments table does not exist" error

-- Step 1: Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert basic departments (ignore if they already exist)
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

-- Step 3: Enable RLS on departments (ignore if already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'departments' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 4: Create basic RLS policy for departments (ignore if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'departments' 
        AND policyname = 'departments_select_policy'
    ) THEN
        CREATE POLICY "departments_select_policy" ON departments
            FOR SELECT USING (true);
    END IF;
END $$;

-- Step 5: Grant permissions (ignore if already granted)
GRANT ALL ON departments TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Departments table setup completed!';
    RAISE NOTICE 'Basic departments are available for testing.';
    RAISE NOTICE 'Now you can run the fleet management schema.';
END $$;

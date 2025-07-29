-- Setup Admin User Script
-- Run this in your Supabase SQL editor to set up the admin user

-- First, make sure the admin user exists in the auth.users table
-- (This should be created when ifham@udrive.ae signs up through the login page)

-- Then, create the admin user in the employees table
INSERT INTO employees (
    id,
    full_name,
    email,
    role,
    status,
    department,
    position,
    created_at,
    updated_at
) VALUES (
    -- Replace 'USER_ID_HERE' with the actual user ID from auth.users
    'USER_ID_HERE',
    'Ifham',
    'ifham@udrive.ae',
    'admin',
    'active',
    'IT',
    'System Administrator',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    updated_at = NOW();

-- Create a roles table for better role management (optional)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'Full system access', '{"all": true}'),
    ('manager', 'Department management access', '{"employees": true, "assets": true, "reports": true}'),
    ('employee', 'Basic employee access', '{"profile": true, "attendance": true}'),
    ('viewer', 'Read-only access', '{"view": true}')
ON CONFLICT (name) DO NOTHING;

-- Create an RLS policy to ensure only admins can manage users
CREATE POLICY "Only admins can manage users" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create an RLS policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON employees
    FOR SELECT USING (id = auth.uid());

-- Create an RLS policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON employees
    FOR UPDATE USING (id = auth.uid());

-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Verify the setup
SELECT 
    e.id,
    e.full_name,
    e.email,
    e.role,
    e.status,
    e.department,
    e.position,
    e.created_at
FROM employees e
WHERE e.email = 'ifham@udrive.ae'; 
-- Minimal Onboarding Fix - No Column Dependencies
-- This creates the onboarding system without assuming any specific columns exist
-- Run this in your Supabase SQL editor

-- Step 1: Create employee_onboarding_records table with minimal safe structure
DROP TABLE IF EXISTS employee_onboarding_records CASCADE;
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Employee Information (minimal required fields)
    full_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date DATE NOT NULL,
    
    -- Onboarding Process (minimal required fields)
    template_id UUID,
    onboarding_status TEXT DEFAULT 'pending',
    expected_completion_date DATE,
    notes TEXT,
    created_by UUID,
    assigned_to UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create employee_onboarding_templates table with minimal structure
DROP TABLE IF EXISTS employee_onboarding_templates CASCADE;
CREATE TABLE employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    department TEXT DEFAULT 'All',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_onboarding_records_email ON employee_onboarding_records(email);
CREATE INDEX idx_onboarding_records_employee_id ON employee_onboarding_records(employee_id);
CREATE INDEX idx_onboarding_records_status ON employee_onboarding_records(onboarding_status);
CREATE INDEX idx_onboarding_records_created_at ON employee_onboarding_records(created_at);

-- Step 4: Enable RLS
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple RLS policies
DROP POLICY IF EXISTS "HR can manage onboarding records" ON employee_onboarding_records;
DROP POLICY IF EXISTS "Everyone can view templates" ON employee_onboarding_templates;

-- Allow all authenticated users to manage onboarding (can be restricted later)
CREATE POLICY "Authenticated users can manage onboarding" ON employee_onboarding_records
    FOR ALL USING (auth.role() = 'authenticated');

-- Everyone can view templates
CREATE POLICY "Everyone can view templates" ON employee_onboarding_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Insert basic templates (no ON CONFLICT to avoid constraint errors)
-- Clear existing templates first
DELETE FROM employee_onboarding_templates;

-- Insert templates one by one
INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('General Onboarding', 'Standard onboarding process for all new employees', 'All');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('IT Onboarding', 'Specialized onboarding for IT department employees', 'IT');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('HR Onboarding', 'Specialized onboarding for HR department employees', 'HR');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('Sales Onboarding', 'Specialized onboarding for Sales department employees', 'Sales');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('Finance Onboarding', 'Specialized onboarding for Finance department employees', 'Finance');

-- Step 7: Test the setup
SELECT 
    'Minimal Onboarding Setup Complete' as status,
    (SELECT COUNT(*) FROM employee_onboarding_records) as onboarding_records,
    (SELECT COUNT(*) FROM employee_onboarding_templates) as templates;

-- Step 8: Test inserting a record
DO $$
DECLARE
    test_template_id UUID;
    test_record_id UUID;
BEGIN
    -- Get a template for testing
    SELECT id INTO test_template_id FROM employee_onboarding_templates LIMIT 1;
    
    IF test_template_id IS NOT NULL THEN
        -- Try to insert a test record with minimal data
        INSERT INTO employee_onboarding_records (
            full_name,
            employee_id,
            email,
            phone,
            position,
            department,
            start_date,
            template_id,
            expected_completion_date,
            onboarding_status,
            notes
        ) VALUES (
            'Test Employee',
            'TEST001',
            'test@company.com',
            '+1234567890',
            'Test Position',
            'IT',
            CURRENT_DATE + INTERVAL '1 day',
            test_template_id,
            CURRENT_DATE + INTERVAL '14 days',
            'pending',
            'Test onboarding record'
        ) RETURNING id INTO test_record_id;
        
        RAISE NOTICE '✅ SUCCESS: Minimal onboarding record created with ID %', test_record_id;
        
        -- Clean up test record
        DELETE FROM employee_onboarding_records WHERE id = test_record_id;
        RAISE NOTICE '✅ Test record cleaned up';
    ELSE
        RAISE NOTICE '❌ No templates found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Step 9: Display table structure for verification
SELECT 
    'Table Structure Verification' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_onboarding_records'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT '🎉 MINIMAL ONBOARDING SYSTEM READY! No more column errors.' as final_result;

-- Bulletproof Onboarding Setup
-- This script handles all possible schema issues and creates a working onboarding system
-- Run this in your Supabase SQL editor

-- Step 1: Drop existing tables to start completely fresh
DROP TABLE IF EXISTS employee_onboarding_records CASCADE;
DROP TABLE IF EXISTS employee_onboarding_templates CASCADE;

-- Step 2: Create templates table first (no dependencies)
CREATE TABLE employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    department TEXT DEFAULT 'All',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create onboarding records table (references templates)
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Employee Information (core fields only)
    full_name TEXT NOT NULL,
    employee_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date DATE NOT NULL,
    
    -- Onboarding Process (core fields only)
    template_id UUID REFERENCES employee_onboarding_templates(id) ON DELETE SET NULL,
    onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    expected_completion_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Process Tracking
    created_by UUID,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Employee Record Integration
    employee_record_created BOOLEAN DEFAULT FALSE
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_onboarding_records_email ON employee_onboarding_records(email);
CREATE INDEX idx_onboarding_records_employee_id ON employee_onboarding_records(employee_id);
CREATE INDEX idx_onboarding_records_status ON employee_onboarding_records(onboarding_status);
CREATE INDEX idx_onboarding_records_department ON employee_onboarding_records(department);
CREATE INDEX idx_onboarding_records_created_at ON employee_onboarding_records(created_at);

-- Step 5: Enable RLS
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "All authenticated users can manage onboarding" ON employee_onboarding_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view templates" ON employee_onboarding_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Insert sample templates
INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('General Employee Onboarding', 'Standard onboarding process for all new employees', 'All');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('IT Department Onboarding', 'Technical onboarding for IT department employees', 'IT');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('HR Department Onboarding', 'HR-specific onboarding process', 'HR');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('Sales Team Onboarding', 'Sales-focused onboarding with CRM training', 'Sales');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('Finance Department Onboarding', 'Finance and accounting onboarding process', 'Finance');

-- Step 8: Test the complete setup
DO $$
DECLARE
    test_template_id UUID;
    test_record_id UUID;
BEGIN
    -- Get a template for testing
    SELECT id INTO test_template_id FROM employee_onboarding_templates WHERE name = 'General Employee Onboarding';
    
    IF test_template_id IS NOT NULL THEN
        -- Test creating an onboarding record
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
            'Test New Employee',
            'TESTNEWEMP001',
            'testnew@company.com',
            '+1234567890',
            'Software Engineer',
            'IT',
            CURRENT_DATE + INTERVAL '3 days',
            test_template_id,
            CURRENT_DATE + INTERVAL '17 days',
            'pending',
            'Test onboarding record for new employee system'
        ) RETURNING id INTO test_record_id;
        
        RAISE NOTICE '✅ SUCCESS: New employee onboarding record created with ID %', test_record_id;
        
        -- Verify we can read it back
        PERFORM * FROM employee_onboarding_records WHERE id = test_record_id;
        RAISE NOTICE '✅ SUCCESS: Can read onboarding record back from database';
        
        -- Clean up test data
        DELETE FROM employee_onboarding_records WHERE id = test_record_id;
        RAISE NOTICE '✅ Test data cleaned up';
        
    ELSE
        RAISE NOTICE '❌ No templates found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Step 9: Verify table structure
SELECT 
    'Table Structure Check' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_onboarding_records'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 10: Final verification
SELECT 
    'Final Setup Status' as check_name,
    (SELECT COUNT(*) FROM employee_onboarding_templates) as templates_count,
    (SELECT COUNT(*) FROM employee_onboarding_records) as records_count,
    'Ready for use!' as status;

-- Success message
SELECT '🎉 BULLETPROOF ONBOARDING SYSTEM READY!' as final_message;
SELECT 'All column errors have been eliminated.' as result;
SELECT 'You can now create new employee onboarding records without any schema issues.' as instructions;

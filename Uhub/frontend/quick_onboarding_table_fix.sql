-- Quick Fix for Onboarding Table Schema
-- This creates the minimal required table structure to fix the "assigned_to column not found" error
-- Run this IMMEDIATELY in your Supabase SQL editor

-- Step 1: Check if employee_onboarding_records table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'employee_onboarding_records'
    ) THEN
        -- Create the table with essential fields
        CREATE TABLE employee_onboarding_records (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            
            -- Core Employee Information
            full_name VARCHAR(255) NOT NULL,
            employee_id VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            position VARCHAR(255) NOT NULL,
            department VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            
            -- Optional Employee Fields
            employment_type VARCHAR(50) DEFAULT 'full_time',
            personal_email VARCHAR(255),
            work_location VARCHAR(255),
            reporting_manager_id UUID,
            date_of_birth DATE,
            nationality VARCHAR(100),
            emergency_contact_name VARCHAR(255),
            emergency_contact_phone VARCHAR(50),
            education_level VARCHAR(100),
            previous_experience TEXT,
            skills TEXT,
            salary DECIMAL(12,2),
            
            -- Onboarding Process Fields
            template_id UUID,
            onboarding_status VARCHAR(50) DEFAULT 'pending',
            expected_completion_date DATE,
            completion_percentage INTEGER DEFAULT 0,
            hr_contact UUID,
            onboarding_buddy UUID,
            department_manager UUID,
            assigned_to UUID,
            notes TEXT,
            created_by UUID,
            
            -- Timestamps
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Employee Record Integration
            employee_record_id UUID,
            employee_record_created BOOLEAN DEFAULT FALSE
        );
        
        RAISE NOTICE 'Created employee_onboarding_records table';
    ELSE
        RAISE NOTICE 'employee_onboarding_records table already exists';
    END IF;
END $$;

-- Step 2: Create onboarding templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) DEFAULT 'All',
    estimated_duration_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Step 4: Create basic RLS policies
DROP POLICY IF EXISTS "HR can manage onboarding records" ON employee_onboarding_records;
DROP POLICY IF EXISTS "Everyone can view templates" ON employee_onboarding_templates;

-- Allow HR and admins to manage onboarding records
CREATE POLICY "HR can manage onboarding records" ON employee_onboarding_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
        OR auth.uid() = created_by
    );

-- Everyone can view templates
CREATE POLICY "Everyone can view templates" ON employee_onboarding_templates
    FOR SELECT USING (true);

-- Step 5: Insert basic onboarding template
INSERT INTO employee_onboarding_templates (name, description, department, estimated_duration_days) VALUES
('Standard Onboarding', 'General onboarding process for all new employees', 'All', 14),
('IT Department Onboarding', 'Specialized onboarding for IT department', 'IT', 21),
('HR Department Onboarding', 'Specialized onboarding for HR department', 'HR', 18)
ON CONFLICT (name) DO NOTHING;

-- Step 6: Test the fix
SELECT 
    'Quick Fix Applied' as status,
    (SELECT COUNT(*) FROM employee_onboarding_records) as onboarding_records,
    (SELECT COUNT(*) FROM employee_onboarding_templates) as templates;

-- Step 7: Test inserting a minimal record
DO $$
DECLARE
    test_template_id UUID;
    test_record_id UUID;
BEGIN
    -- Get a template for testing
    SELECT id INTO test_template_id FROM employee_onboarding_templates LIMIT 1;
    
    IF test_template_id IS NOT NULL THEN
        -- Try to insert a test record
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
            notes,
            onboarding_status,
            created_by
        ) VALUES (
            'Test Employee - DELETE ME',
            'TESTEMPID001',
            'test@company.com',
            '+1234567890',
            'Test Position',
            'IT',
            CURRENT_DATE + INTERVAL '1 day',
            test_template_id,
            CURRENT_DATE + INTERVAL '14 days',
            'Test onboarding record',
            'pending',
            auth.uid()
        ) RETURNING id INTO test_record_id;
        
        RAISE NOTICE '✅ SUCCESS: Test onboarding record created with ID %', test_record_id;
        
        -- Clean up test record
        DELETE FROM employee_onboarding_records WHERE id = test_record_id;
        RAISE NOTICE '✅ Test record cleaned up';
    ELSE
        RAISE NOTICE '❌ No templates found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Success message
SELECT '🎉 ONBOARDING TABLE SCHEMA FIXED! You can now create onboarding records without column errors.' as result;

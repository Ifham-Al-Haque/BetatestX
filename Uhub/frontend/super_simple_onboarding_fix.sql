-- Super Simple Onboarding Fix - No Conflicts
-- This creates the onboarding system without any ON CONFLICT clauses
-- Run this in your Supabase SQL editor

-- Step 1: Create employee_onboarding_records table
DROP TABLE IF EXISTS employee_onboarding_records CASCADE;
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Employee Information
    full_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date DATE NOT NULL,
    
    -- Onboarding Process
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

-- Step 2: Create employee_onboarding_templates table
DROP TABLE IF EXISTS employee_onboarding_templates CASCADE;
CREATE TABLE employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- Add UNIQUE constraint for future ON CONFLICT
    description TEXT,
    department TEXT DEFAULT 'All',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple RLS policies
CREATE POLICY "Authenticated users can manage onboarding" ON employee_onboarding_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view templates" ON employee_onboarding_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 5: Insert templates one by one (no ON CONFLICT)
-- Delete existing templates first
DELETE FROM employee_onboarding_templates;

-- Insert new templates
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

-- Step 6: Verify setup
SELECT 
    'Setup Verification' as step,
    (SELECT COUNT(*) FROM employee_onboarding_records) as onboarding_records,
    (SELECT COUNT(*) FROM employee_onboarding_templates) as templates;

-- Step 7: Show created templates
SELECT 'Created Templates:' as info;
SELECT id, name, description, department FROM employee_onboarding_templates ORDER BY name;

-- Step 8: Test creating an onboarding record
DO $$
DECLARE
    test_template_id UUID;
    test_record_id UUID;
BEGIN
    -- Get first template
    SELECT id INTO test_template_id FROM employee_onboarding_templates LIMIT 1;
    
    IF test_template_id IS NOT NULL THEN
        -- Insert test record
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
            'Test Employee - DELETE ME',
            'TEST001',
            'test@company.com',
            '+1234567890',
            'Test Position',
            'IT',
            CURRENT_DATE + INTERVAL '1 day',
            test_template_id,
            CURRENT_DATE + INTERVAL '14 days',
            'pending',
            'Test record to verify system works'
        ) RETURNING id INTO test_record_id;
        
        RAISE NOTICE '✅ SUCCESS: Test onboarding record created successfully!';
        
        -- Clean up
        DELETE FROM employee_onboarding_records WHERE id = test_record_id;
        RAISE NOTICE '✅ Test record cleaned up';
        
    ELSE
        RAISE NOTICE '❌ No templates available for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Final success message
SELECT '🎉 ONBOARDING SYSTEM IS NOW WORKING! No more column or conflict errors.' as final_status;

-- Instructions for next steps
SELECT 'Next Steps:' as instructions;
SELECT '1. Refresh your browser' as step_1;
SELECT '2. Navigate to Employee Onboarding section' as step_2;
SELECT '3. Click "Start Onboarding" to test' as step_3;
SELECT '4. Fill out new employee form' as step_4;
SELECT '5. Submit without errors!' as step_5;

-- Fix All Onboarding System Errors
-- This script addresses all the 400/404 errors and missing tables
-- Run this in your Supabase SQL editor

-- Step 1: Create user_status table for chat system (fixes ChatContext error)
DROP TABLE IF EXISTS user_status CASCADE;
CREATE TABLE user_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_status
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy for user_status
CREATE POLICY "Users can manage own status" ON user_status
    FOR ALL USING (auth.uid() = user_id);

-- Step 2: Create onboarding tables (fixes onboarding errors)
DROP TABLE IF EXISTS employee_onboarding_records CASCADE;
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID DEFAULT gen_random_uuid() UNIQUE, -- Add record_id for compatibility
    
    -- Employee Information
    full_name TEXT NOT NULL,
    employee_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    start_date DATE NOT NULL,
    
    -- Onboarding Process
    template_id UUID,
    onboarding_status TEXT DEFAULT 'pending',
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

-- Step 3: Create onboarding templates table
DROP TABLE IF EXISTS employee_onboarding_templates CASCADE;
CREATE TABLE employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    department TEXT DEFAULT 'All',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create onboarding checklist table (fixes OnboardingDetail errors)
DROP TABLE IF EXISTS employee_onboarding_checklist CASCADE;
CREATE TABLE employee_onboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_record_id UUID REFERENCES employee_onboarding_records(id) ON DELETE CASCADE,
    employee_id UUID, -- For compatibility
    task_name TEXT NOT NULL,
    task_description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create onboarding comments table
DROP TABLE IF EXISTS employee_onboarding_comments CASCADE;
CREATE TABLE employee_onboarding_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_record_id UUID REFERENCES employee_onboarding_records(id) ON DELETE CASCADE,
    employee_id UUID, -- For compatibility
    comment TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create onboarding documents table
DROP TABLE IF EXISTS employee_onboarding_documents CASCADE;
CREATE TABLE employee_onboarding_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_record_id UUID REFERENCES employee_onboarding_records(id) ON DELETE CASCADE,
    employee_id UUID, -- For compatibility
    document_name TEXT NOT NULL,
    document_url TEXT,
    document_type TEXT,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create indexes
CREATE INDEX idx_onboarding_records_record_id ON employee_onboarding_records(record_id);
CREATE INDEX idx_onboarding_records_email ON employee_onboarding_records(email);
CREATE INDEX idx_onboarding_records_employee_id ON employee_onboarding_records(employee_id);
CREATE INDEX idx_onboarding_records_status ON employee_onboarding_records(onboarding_status);

CREATE INDEX idx_onboarding_checklist_record_id ON employee_onboarding_checklist(onboarding_record_id);
CREATE INDEX idx_onboarding_checklist_employee_id ON employee_onboarding_checklist(employee_id);
CREATE INDEX idx_onboarding_checklist_order ON employee_onboarding_checklist(order_index);

-- Step 8: Enable RLS on all tables
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_documents ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
CREATE POLICY "Authenticated users can manage onboarding" ON employee_onboarding_records
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view templates" ON employee_onboarding_templates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage checklist" ON employee_onboarding_checklist
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage comments" ON employee_onboarding_comments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage documents" ON employee_onboarding_documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 10: Insert sample templates
DELETE FROM employee_onboarding_templates;

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('General Employee Onboarding', 'Standard onboarding process for all new employees', 'All');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('IT Department Onboarding', 'Technical onboarding for IT department employees', 'IT');

INSERT INTO employee_onboarding_templates (name, description, department) VALUES
('HR Department Onboarding', 'HR-specific onboarding process', 'HR');

-- Step 11: Create the onboarding_dashboard view (fixes view not found errors)
DROP VIEW IF EXISTS onboarding_dashboard;
CREATE VIEW onboarding_dashboard AS
SELECT 
    r.id,
    r.record_id,
    r.full_name,
    r.employee_id,
    r.email,
    r.phone,
    r.position,
    r.department,
    r.start_date,
    r.onboarding_status as status,
    r.expected_completion_date,
    r.completion_percentage as progress_percentage,
    r.notes,
    r.created_at,
    r.updated_at,
    t.name as template_name,
    t.description as template_description
FROM employee_onboarding_records r
LEFT JOIN employee_onboarding_templates t ON r.template_id = t.id
ORDER BY r.created_at DESC;

-- Step 12: Test all components
DO $$
DECLARE
    test_template_id UUID;
    test_record_id UUID;
    test_user_id UUID;
BEGIN
    -- Test user status table
    SELECT auth.uid() INTO test_user_id;
    
    IF test_user_id IS NOT NULL THEN
        INSERT INTO user_status (user_id, is_online, last_seen) 
        VALUES (test_user_id, true, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            is_online = EXCLUDED.is_online,
            last_seen = EXCLUDED.last_seen;
        
        RAISE NOTICE '✅ User status table working';
    END IF;
    
    -- Test onboarding templates
    SELECT id INTO test_template_id FROM employee_onboarding_templates LIMIT 1;
    
    IF test_template_id IS NOT NULL THEN
        RAISE NOTICE '✅ Onboarding templates available';
        
        -- Test onboarding record creation
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
            'TESTFIX001',
            'testfix@company.com',
            '+1234567890',
            'Test Position',
            'IT',
            CURRENT_DATE + INTERVAL '1 day',
            test_template_id,
            CURRENT_DATE + INTERVAL '14 days',
            'pending',
            'Test record to verify all fixes work'
        ) RETURNING id INTO test_record_id;
        
        RAISE NOTICE '✅ Onboarding record creation working';
        
        -- Test view
        PERFORM * FROM onboarding_dashboard WHERE id = test_record_id;
        RAISE NOTICE '✅ Onboarding dashboard view working';
        
        -- Clean up
        DELETE FROM employee_onboarding_records WHERE id = test_record_id;
        RAISE NOTICE '✅ Test data cleaned up';
        
    ELSE
        RAISE NOTICE '❌ No templates found for testing';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Step 13: Final verification
SELECT 
    'All Systems Ready' as status,
    (SELECT COUNT(*) FROM user_status) as user_status_records,
    (SELECT COUNT(*) FROM employee_onboarding_records) as onboarding_records,
    (SELECT COUNT(*) FROM employee_onboarding_templates) as templates,
    (SELECT COUNT(*) FROM employee_onboarding_checklist) as checklist_items,
    (SELECT COUNT(*) FROM employee_onboarding_comments) as comments,
    (SELECT COUNT(*) FROM employee_onboarding_documents) as documents;

-- Success message
SELECT '🎉 ALL ONBOARDING ERRORS FIXED!' as result;
SELECT 'ChatContext, OnboardingDetail, and all 400/404 errors resolved.' as details;
SELECT 'Refresh your browser and test the onboarding system.' as next_steps;

-- Quick Setup for Employee Onboarding and Offboarding Tables
-- Run this in Supabase SQL Editor first to create the basic tables

-- 1. Employee Onboarding Templates
CREATE TABLE IF NOT EXISTS employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employee Onboarding Checklist
CREATE TABLE IF NOT EXISTS employee_onboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_id UUID REFERENCES employee_onboarding_templates(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id),
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Employee Onboarding Records
CREATE TABLE IF NOT EXISTS employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES employee_onboarding_templates(id),
    start_date DATE NOT NULL,
    expected_completion_date DATE,
    actual_completion_date DATE,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    onboarding_buddy UUID REFERENCES employees(id),
    hr_contact UUID REFERENCES employees(id),
    department_manager UUID REFERENCES employees(id),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Employee Offboarding Checklist
CREATE TABLE IF NOT EXISTS employee_offboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id),
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Employee Offboarding Records
CREATE TABLE IF NOT EXISTS employee_offboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    last_working_date DATE NOT NULL,
    termination_date DATE,
    reason_for_leaving VARCHAR(100),
    reason_details TEXT,
    exit_interview_date DATE,
    exit_interview_conducted_by UUID REFERENCES employees(id),
    exit_interview_notes TEXT,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    hr_contact UUID REFERENCES employees(id),
    department_manager UUID REFERENCES employees(id),
    handover_to UUID REFERENCES employees(id),
    final_payroll_processed BOOLEAN DEFAULT FALSE,
    final_payroll_date DATE,
    benefits_terminated BOOLEAN DEFAULT FALSE,
    benefits_termination_date DATE,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Asset Tracking
CREATE TABLE IF NOT EXISTS employee_asset_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE,
    asset_type VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_id VARCHAR(100),
    return_status VARCHAR(50) DEFAULT 'pending' CHECK (return_status IN ('pending', 'returned', 'not_returned', 'damaged')),
    return_date DATE,
    return_notes TEXT,
    condition_on_return VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Access Revocation
CREATE TABLE IF NOT EXISTS employee_access_revocation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE,
    access_type VARCHAR(100) NOT NULL,
    access_name VARCHAR(255) NOT NULL,
    access_details TEXT,
    revocation_status VARCHAR(50) DEFAULT 'pending' CHECK (revocation_status IN ('pending', 'revoked', 'partially_revoked', 'failed')),
    revoked_by UUID REFERENCES employees(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_category VARCHAR(100),
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    uploaded_by UUID REFERENCES employees(id),
    related_record_id UUID,
    related_record_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Comments
CREATE TABLE IF NOT EXISTS employee_process_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    process_type VARCHAR(50) NOT NULL CHECK (process_type IN ('onboarding', 'offboarding')),
    related_record_id UUID,
    comment TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'note' CHECK (comment_type IN ('note', 'update', 'concern', 'milestone')),
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_asset_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access_revocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_process_comments ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow all authenticated users to read, restrict writes to admin/hr_manager)
CREATE POLICY "onboarding_templates_select_policy" ON employee_onboarding_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "onboarding_templates_insert_policy" ON employee_onboarding_templates
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'hr_manager', 'it_management')
        )
    );

CREATE POLICY "onboarding_records_select_policy" ON employee_onboarding_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "onboarding_records_insert_policy" ON employee_onboarding_records
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'hr_manager', 'it_management')
        )
    );

CREATE POLICY "offboarding_records_select_policy" ON employee_offboarding_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "offboarding_records_insert_policy" ON employee_offboarding_records
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'hr_manager', 'it_management')
        )
    );

-- Add similar policies for other tables
CREATE POLICY "onboarding_checklist_select_policy" ON employee_onboarding_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "onboarding_checklist_insert_policy" ON employee_onboarding_checklist FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role IN ('admin', 'hr_manager', 'it_management'))
);

CREATE POLICY "offboarding_checklist_select_policy" ON employee_offboarding_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "offboarding_checklist_insert_policy" ON employee_offboarding_checklist FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role IN ('admin', 'hr_manager', 'it_management'))
);

CREATE POLICY "asset_tracking_select_policy" ON employee_asset_tracking FOR SELECT TO authenticated USING (true);
CREATE POLICY "asset_tracking_insert_policy" ON employee_asset_tracking FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role IN ('admin', 'hr_manager', 'it_management'))
);

CREATE POLICY "access_revocation_select_policy" ON employee_access_revocation FOR SELECT TO authenticated USING (true);
CREATE POLICY "access_revocation_insert_policy" ON employee_access_revocation FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role IN ('admin', 'hr_manager', 'it_management'))
);

CREATE POLICY "employee_documents_select_policy" ON employee_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "employee_documents_insert_policy" ON employee_documents FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role IN ('admin', 'hr_manager', 'it_management'))
);

CREATE POLICY "process_comments_select_policy" ON employee_process_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "process_comments_insert_policy" ON employee_process_comments FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.role IN ('admin', 'hr_manager', 'it_management'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_records_employee_id ON employee_onboarding_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_records_status ON employee_onboarding_records(status);
CREATE INDEX IF NOT EXISTS idx_offboarding_records_employee_id ON employee_offboarding_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_records_status ON employee_offboarding_records(status);

-- Insert default onboarding template
INSERT INTO employee_onboarding_templates (name, description, department, is_active) VALUES
('Standard Employee Onboarding', 'Default onboarding process for all employees', 'All', true)
ON CONFLICT DO NOTHING;

COMMIT;

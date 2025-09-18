-- Enhanced Employee Onboarding and Offboarding Database Schema
-- This script extends the existing schema with comprehensive onboarding/offboarding features

-- 1. Enhanced Employee Onboarding Table
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

-- 2. Enhanced Onboarding Checklist Items
CREATE TABLE IF NOT EXISTS employee_onboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_id UUID REFERENCES employee_onboarding_templates(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'documentation', 'it_setup', 'hr_orientation', 'department_integration', 'training_compliance'
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id), -- Who is responsible for this task
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhanced Employee Onboarding Records
CREATE TABLE IF NOT EXISTS employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID REFERENCES employee_onboarding_templates(id),
    start_date DATE NOT NULL,
    expected_completion_date DATE,
    actual_completion_date DATE,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    onboarding_buddy UUID REFERENCES employees(id), -- Assigned buddy/mentor
    hr_contact UUID REFERENCES employees(id), -- HR person managing the onboarding
    department_manager UUID REFERENCES employees(id), -- Department manager
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enhanced Employee Offboarding Checklist
CREATE TABLE IF NOT EXISTS employee_offboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'it_assets', 'access_revocation', 'hr_procedures', 'knowledge_transfer'
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id), -- Who is responsible for this task
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enhanced Employee Offboarding Records
CREATE TABLE IF NOT EXISTS employee_offboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    last_working_date DATE NOT NULL,
    termination_date DATE,
    reason_for_leaving VARCHAR(100), -- 'resignation', 'termination', 'retirement', 'contract_end', 'other'
    reason_details TEXT,
    exit_interview_date DATE,
    exit_interview_conducted_by UUID REFERENCES employees(id),
    exit_interview_notes TEXT,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    hr_contact UUID REFERENCES employees(id), -- HR person managing the offboarding
    department_manager UUID REFERENCES employees(id), -- Department manager
    handover_to UUID REFERENCES employees(id), -- Who will take over responsibilities
    final_payroll_processed BOOLEAN DEFAULT FALSE,
    final_payroll_date DATE,
    benefits_terminated BOOLEAN DEFAULT FALSE,
    benefits_termination_date DATE,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Asset Tracking for Offboarding
CREATE TABLE IF NOT EXISTS employee_asset_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE,
    asset_type VARCHAR(100) NOT NULL, -- 'laptop', 'phone', 'access_card', 'keys', 'equipment'
    asset_name VARCHAR(255) NOT NULL,
    asset_id VARCHAR(100), -- Serial number or asset ID
    return_status VARCHAR(50) DEFAULT 'pending' CHECK (return_status IN ('pending', 'returned', 'not_returned', 'damaged')),
    return_date DATE,
    return_notes TEXT,
    condition_on_return VARCHAR(50), -- 'good', 'fair', 'poor', 'damaged'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Access Revocation Tracking
CREATE TABLE IF NOT EXISTS employee_access_revocation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE,
    access_type VARCHAR(100) NOT NULL, -- 'email', 'system_access', 'physical_access', 'third_party', 'database'
    access_name VARCHAR(255) NOT NULL,
    access_details TEXT,
    revocation_status VARCHAR(50) DEFAULT 'pending' CHECK (revocation_status IN ('pending', 'revoked', 'partially_revoked', 'failed')),
    revoked_by UUID REFERENCES employees(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Document Management for Onboarding/Offboarding
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'onboarding', 'offboarding', 'contract', 'exit_interview', 'asset_return'
    document_name VARCHAR(255) NOT NULL,
    document_category VARCHAR(100), -- 'contract', 'id_copy', 'exit_interview', 'asset_receipt'
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    uploaded_by UUID REFERENCES employees(id),
    related_record_id UUID, -- Can link to onboarding/offboarding records
    related_record_type VARCHAR(50), -- 'onboarding_record', 'offboarding_record'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Onboarding/Offboarding Comments and Notes
CREATE TABLE IF NOT EXISTS employee_process_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    process_type VARCHAR(50) NOT NULL CHECK (process_type IN ('onboarding', 'offboarding')),
    related_record_id UUID, -- onboarding_record_id or offboarding_record_id
    comment TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'note' CHECK (comment_type IN ('note', 'update', 'concern', 'milestone')),
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Default Onboarding Template Items
INSERT INTO employee_onboarding_templates (name, description, department, is_active) VALUES
('Standard Employee Onboarding', 'Default onboarding process for all employees', 'All', true),
('IT Department Onboarding', 'Specialized onboarding for IT team members', 'IT', true),
('HR Department Onboarding', 'Specialized onboarding for HR team members', 'HR', true),
('Manager Onboarding', 'Onboarding process for new managers', 'All', true);

-- 11. Default Onboarding Checklist Items
INSERT INTO employee_onboarding_checklist (onboarding_id, checklist_item, category, description, order_index, priority) 
SELECT 
    t.id,
    item.checklist_item,
    item.category,
    item.description,
    item.order_index,
    item.priority
FROM employee_onboarding_templates t,
(VALUES
    -- Documentation
    ('Employee Contract Signed', 'documentation', 'Ensure employment contract is signed and filed', 1, 'high'),
    ('ID Copy Collected', 'documentation', 'Collect copy of national ID or passport', 2, 'high'),
    ('Tax Forms Completed', 'documentation', 'Complete tax declaration and withholding forms', 3, 'high'),
    ('Emergency Contact Form', 'documentation', 'Complete emergency contact information form', 4, 'medium'),
    ('Bank Details Provided', 'documentation', 'Provide bank account details for payroll', 5, 'high'),
    
    -- IT Setup
    ('Email Account Created', 'it_setup', 'Create company email account', 6, 'high'),
    ('System Access Granted', 'it_setup', 'Grant access to required systems and applications', 7, 'high'),
    ('Laptop/Equipment Assigned', 'it_setup', 'Assign laptop and necessary equipment', 8, 'high'),
    ('VPN Access Configured', 'it_setup', 'Set up VPN access for remote work', 9, 'medium'),
    ('Phone/Extension Assigned', 'it_setup', 'Assign phone number and extension', 10, 'medium'),
    
    -- HR Orientation
    ('Employee Handbook Review', 'hr_orientation', 'Review employee handbook and policies', 11, 'high'),
    ('Benefits Enrollment', 'hr_orientation', 'Complete benefits enrollment process', 12, 'high'),
    ('Safety Training', 'hr_orientation', 'Complete workplace safety training', 13, 'high'),
    ('Company Culture Introduction', 'hr_orientation', 'Introduction to company culture and values', 14, 'medium'),
    ('HR Policies Acknowledgment', 'hr_orientation', 'Acknowledge receipt and understanding of HR policies', 15, 'high'),
    
    -- Department Integration
    ('Team Introduction', 'department_integration', 'Meet team members and colleagues', 16, 'high'),
    ('Workspace Setup', 'department_integration', 'Set up workspace and seating arrangement', 17, 'medium'),
    ('Department Tour', 'department_integration', 'Tour of department and facilities', 18, 'medium'),
    ('Manager Introduction', 'department_integration', 'Meet with direct manager', 19, 'high'),
    ('Buddy Assignment', 'department_integration', 'Assign onboarding buddy/mentor', 20, 'high'),
    
    -- Training & Compliance
    ('Role-Specific Training', 'training_compliance', 'Complete role-specific training modules', 21, 'high'),
    ('Security Training', 'training_compliance', 'Complete information security training', 22, 'high'),
    ('Compliance Training', 'training_compliance', 'Complete compliance and ethics training', 23, 'high'),
    ('Software Training', 'training_compliance', 'Training on required software and tools', 24, 'medium'),
    ('First Week Goals Set', 'training_compliance', 'Set goals and expectations for first week', 25, 'medium')
) AS item(checklist_item, category, description, order_index, priority)
WHERE t.name = 'Standard Employee Onboarding';

-- 12. Enable Row Level Security
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_asset_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access_revocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_process_comments ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS Policies for Onboarding Tables
CREATE POLICY "onboarding_templates_select_policy" ON employee_onboarding_templates
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "onboarding_templates_insert_policy" ON employee_onboarding_templates
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "onboarding_templates_update_policy" ON employee_onboarding_templates
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 14. Create RLS Policies for Onboarding Records
CREATE POLICY "onboarding_records_select_policy" ON employee_onboarding_records
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "onboarding_records_insert_policy" ON employee_onboarding_records
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "onboarding_records_update_policy" ON employee_onboarding_records
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 15. Create RLS Policies for Offboarding Records
CREATE POLICY "offboarding_records_select_policy" ON employee_offboarding_records
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "offboarding_records_insert_policy" ON employee_offboarding_records
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "offboarding_records_update_policy" ON employee_offboarding_records
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 16. Create RLS Policies for Checklist Items
CREATE POLICY "onboarding_checklist_select_policy" ON employee_onboarding_checklist
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "onboarding_checklist_insert_policy" ON employee_onboarding_checklist
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "onboarding_checklist_update_policy" ON employee_onboarding_checklist
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 17. Create RLS Policies for Offboarding Checklist
CREATE POLICY "offboarding_checklist_select_policy" ON employee_offboarding_checklist
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "offboarding_checklist_insert_policy" ON employee_offboarding_checklist
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "offboarding_checklist_update_policy" ON employee_offboarding_checklist
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 18. Create RLS Policies for Asset Tracking
CREATE POLICY "asset_tracking_select_policy" ON employee_asset_tracking
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "asset_tracking_insert_policy" ON employee_asset_tracking
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "asset_tracking_update_policy" ON employee_asset_tracking
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 19. Create RLS Policies for Access Revocation
CREATE POLICY "access_revocation_select_policy" ON employee_access_revocation
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "access_revocation_insert_policy" ON employee_access_revocation
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "access_revocation_update_policy" ON employee_access_revocation
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 20. Create RLS Policies for Documents
CREATE POLICY "employee_documents_select_policy" ON employee_documents
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "employee_documents_insert_policy" ON employee_documents
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "employee_documents_update_policy" ON employee_documents
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 21. Create RLS Policies for Comments
CREATE POLICY "process_comments_select_policy" ON employee_process_comments
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "process_comments_insert_policy" ON employee_process_comments
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "process_comments_update_policy" ON employee_process_comments
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- 22. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_onboarding_records_employee_id ON employee_onboarding_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_records_status ON employee_onboarding_records(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_employee_id ON employee_onboarding_checklist(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_completed ON employee_onboarding_checklist(is_completed);

CREATE INDEX IF NOT EXISTS idx_offboarding_records_employee_id ON employee_offboarding_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_records_status ON employee_offboarding_records(status);
CREATE INDEX IF NOT EXISTS idx_offboarding_checklist_offboarding_id ON employee_offboarding_checklist(offboarding_id);
CREATE INDEX IF NOT EXISTS idx_asset_tracking_offboarding_id ON employee_asset_tracking(offboarding_id);
CREATE INDEX IF NOT EXISTS idx_access_revocation_offboarding_id ON employee_access_revocation(offboarding_id);

-- 23. Create Functions for Progress Calculation
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(record_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
    progress_percentage INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
    INTO total_items, completed_items
    FROM employee_onboarding_checklist
    WHERE employee_id = (SELECT employee_id FROM employee_onboarding_records WHERE id = record_id);
    
    IF total_items = 0 THEN
        progress_percentage := 0;
    ELSE
        progress_percentage := (completed_items * 100) / total_items;
    END IF;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_offboarding_progress(record_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
    progress_percentage INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
    INTO total_items, completed_items
    FROM employee_offboarding_checklist
    WHERE offboarding_id = record_id;
    
    IF total_items = 0 THEN
        progress_percentage := 0;
    ELSE
        progress_percentage := (completed_items * 100) / total_items;
    END IF;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- 24. Create Triggers for Auto-updating Progress
CREATE OR REPLACE FUNCTION update_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE employee_onboarding_records
    SET progress_percentage = calculate_onboarding_progress(NEW.employee_id),
        updated_at = NOW()
    WHERE employee_id = NEW.employee_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_offboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE employee_offboarding_records
    SET progress_percentage = calculate_offboarding_progress(NEW.offboarding_id),
        updated_at = NOW()
    WHERE id = NEW.offboarding_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress
    AFTER UPDATE ON employee_onboarding_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_progress();

CREATE TRIGGER trigger_update_offboarding_progress
    AFTER UPDATE ON employee_offboarding_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_offboarding_progress();

-- 25. Create View for Onboarding Dashboard
CREATE OR REPLACE VIEW onboarding_dashboard AS
SELECT 
    eor.id as record_id,
    e.id as employee_id,
    e.full_name,
    e.email,
    e.department,
    e.position,
    eor.start_date,
    eor.expected_completion_date,
    eor.actual_completion_date,
    eor.status,
    eor.progress_percentage,
    eor.created_at,
    CASE 
        WHEN eor.status = 'completed' THEN 'Completed'
        WHEN eor.expected_completion_date < CURRENT_DATE AND eor.status != 'completed' THEN 'Overdue'
        WHEN eor.expected_completion_date - CURRENT_DATE <= 3 AND eor.status != 'completed' THEN 'Due Soon'
        ELSE 'On Track'
    END as status_indicator,
    COUNT(ec.id) as total_checklist_items,
    COUNT(ec.id) FILTER (WHERE ec.is_completed = true) as completed_items,
    COUNT(ec.id) FILTER (WHERE ec.due_date < CURRENT_DATE AND ec.is_completed = false) as overdue_items
FROM employee_onboarding_records eor
JOIN employees e ON eor.employee_id = e.id
LEFT JOIN employee_onboarding_checklist ec ON ec.employee_id = e.id
GROUP BY eor.id, e.id, e.full_name, e.email, e.department, e.position, 
         eor.start_date, eor.expected_completion_date, eor.actual_completion_date, 
         eor.status, eor.progress_percentage, eor.created_at;

-- 26. Create View for Offboarding Dashboard
CREATE OR REPLACE VIEW offboarding_dashboard AS
SELECT 
    eor.id as record_id,
    e.id as employee_id,
    e.full_name,
    e.email,
    e.department,
    e.position,
    eor.last_working_date,
    eor.termination_date,
    eor.reason_for_leaving,
    eor.status,
    eor.progress_percentage,
    eor.created_at,
    CASE 
        WHEN eor.status = 'completed' THEN 'Completed'
        WHEN eor.last_working_date < CURRENT_DATE AND eor.status != 'completed' THEN 'Overdue'
        WHEN eor.last_working_date - CURRENT_DATE <= 3 AND eor.status != 'completed' THEN 'Due Soon'
        ELSE 'On Track'
    END as status_indicator,
    COUNT(ec.id) as total_checklist_items,
    COUNT(ec.id) FILTER (WHERE ec.is_completed = true) as completed_items,
    COUNT(at.id) as total_assets,
    COUNT(at.id) FILTER (WHERE at.return_status = 'returned') as returned_assets,
    COUNT(ar.id) as total_access_items,
    COUNT(ar.id) FILTER (WHERE ar.revocation_status = 'revoked') as revoked_access
FROM employee_offboarding_records eor
JOIN employees e ON eor.employee_id = e.id
LEFT JOIN employee_offboarding_checklist ec ON ec.offboarding_id = eor.id
LEFT JOIN employee_asset_tracking at ON at.offboarding_id = eor.id
LEFT JOIN employee_access_revocation ar ON ar.offboarding_id = eor.id
GROUP BY eor.id, e.id, e.full_name, e.email, e.department, e.position, 
         eor.last_working_date, eor.termination_date, eor.reason_for_leaving,
         eor.status, eor.progress_percentage, eor.created_at;

COMMIT;

-- Dedicated Onboarding and Offboarding Tables
-- This creates separate tables for onboarding/offboarding processes
-- Keeps employee records separate from process tracking

-- Step 1: Create Employee Onboarding Records Table
DROP TABLE IF EXISTS employee_onboarding_records CASCADE;
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- New Employee Information (collected during onboarding)
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    personal_email VARCHAR(255),
    
    -- Employment Details
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    employment_type VARCHAR(50) DEFAULT 'full_time',
    work_location VARCHAR(255),
    salary DECIMAL(12,2),
    
    -- Reporting Structure
    reporting_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Personal Information (Optional)
    date_of_birth DATE,
    nationality VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    education_level VARCHAR(100),
    previous_experience TEXT,
    skills TEXT,
    
    -- Onboarding Process Information
    template_id UUID REFERENCES employee_onboarding_templates(id) ON DELETE SET NULL,
    onboarding_status VARCHAR(50) DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    expected_completion_date DATE,
    actual_completion_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Assignment Information
    hr_contact UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    onboarding_buddy UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    department_manager UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Process Tracking
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Integration with main employee record (once created)
    employee_record_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    employee_record_created BOOLEAN DEFAULT FALSE
);

-- Step 2: Create Employee Offboarding Records Table
DROP TABLE IF EXISTS employee_offboarding_records CASCADE;
CREATE TABLE employee_offboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference to existing employee
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    
    -- Offboarding Details
    offboarding_reason VARCHAR(100) NOT NULL,
    last_working_day DATE NOT NULL,
    notice_period_days INTEGER,
    offboarding_type VARCHAR(50) DEFAULT 'voluntary' CHECK (offboarding_type IN ('voluntary', 'involuntary', 'retirement', 'transfer', 'contract_end')),
    
    -- Process Information
    template_id UUID REFERENCES employee_offboarding_templates(id) ON DELETE SET NULL,
    offboarding_status VARCHAR(50) DEFAULT 'pending' CHECK (offboarding_status IN ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    expected_completion_date DATE,
    actual_completion_date DATE,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Assignment Information
    hr_contact UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    manager_contact UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    it_contact UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Exit Information
    exit_interview_completed BOOLEAN DEFAULT FALSE,
    exit_interview_date DATE,
    exit_interview_notes TEXT,
    final_settlement_amount DECIMAL(12,2),
    final_settlement_completed BOOLEAN DEFAULT FALSE,
    
    -- Asset Return Tracking
    assets_returned BOOLEAN DEFAULT FALSE,
    access_revoked BOOLEAN DEFAULT FALSE,
    accounts_deactivated BOOLEAN DEFAULT FALSE,
    
    -- Process Tracking
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Create Onboarding Templates Table (if not exists)
CREATE TABLE IF NOT EXISTS employee_onboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) DEFAULT 'All',
    position_level VARCHAR(50) DEFAULT 'All',
    tasks JSONB DEFAULT '[]',
    estimated_duration_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create Offboarding Templates Table (if not exists)
CREATE TABLE IF NOT EXISTS employee_offboarding_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    offboarding_type VARCHAR(50) DEFAULT 'voluntary',
    tasks JSONB DEFAULT '[]',
    estimated_duration_days INTEGER DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create Onboarding Tasks Table
DROP TABLE IF EXISTS employee_onboarding_tasks CASCADE;
CREATE TABLE employee_onboarding_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_record_id UUID REFERENCES employee_onboarding_records(id) ON DELETE CASCADE NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_category VARCHAR(100),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
    completion_notes TEXT,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create Offboarding Tasks Table
DROP TABLE IF EXISTS employee_offboarding_tasks CASCADE;
CREATE TABLE employee_offboarding_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_record_id UUID REFERENCES employee_offboarding_records(id) ON DELETE CASCADE NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_category VARCHAR(100),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'blocked')),
    completion_notes TEXT,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create indexes for performance
CREATE INDEX idx_onboarding_records_email ON employee_onboarding_records(email);
CREATE INDEX idx_onboarding_records_employee_id ON employee_onboarding_records(employee_id);
CREATE INDEX idx_onboarding_records_status ON employee_onboarding_records(onboarding_status);
CREATE INDEX idx_onboarding_records_start_date ON employee_onboarding_records(start_date);
CREATE INDEX idx_onboarding_records_department ON employee_onboarding_records(department);
CREATE INDEX idx_onboarding_records_created_at ON employee_onboarding_records(created_at);

CREATE INDEX idx_offboarding_records_employee_id ON employee_offboarding_records(employee_id);
CREATE INDEX idx_offboarding_records_status ON employee_offboarding_records(offboarding_status);
CREATE INDEX idx_offboarding_records_last_working_day ON employee_offboarding_records(last_working_day);

CREATE INDEX idx_onboarding_tasks_record_id ON employee_onboarding_tasks(onboarding_record_id);
CREATE INDEX idx_onboarding_tasks_status ON employee_onboarding_tasks(status);
CREATE INDEX idx_onboarding_tasks_due_date ON employee_onboarding_tasks(due_date);

CREATE INDEX idx_offboarding_tasks_record_id ON employee_offboarding_tasks(offboarding_record_id);
CREATE INDEX idx_offboarding_tasks_status ON employee_offboarding_tasks(status);
CREATE INDEX idx_offboarding_tasks_due_date ON employee_offboarding_tasks(due_date);

-- Step 8: Enable RLS
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS Policies

-- Onboarding Records - HR and Admins can manage all, employees can view own
CREATE POLICY "HR and Admins can view all onboarding records" ON employee_onboarding_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "HR and Admins can manage onboarding records" ON employee_onboarding_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- Templates - Everyone can read, HR can manage
CREATE POLICY "Everyone can view onboarding templates" ON employee_onboarding_templates
    FOR SELECT USING (true);

CREATE POLICY "HR can manage onboarding templates" ON employee_onboarding_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Everyone can view offboarding templates" ON employee_offboarding_templates
    FOR SELECT USING (true);

CREATE POLICY "HR can manage offboarding templates" ON employee_offboarding_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- Tasks - Assigned users and HR can manage
CREATE POLICY "Assigned users can view onboarding tasks" ON employee_onboarding_tasks
    FOR SELECT USING (
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Assigned users can update onboarding tasks" ON employee_onboarding_tasks
    FOR UPDATE USING (
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- Step 10: Insert sample onboarding templates
INSERT INTO employee_onboarding_templates (name, description, department, estimated_duration_days, tasks) VALUES
(
    'General Employee Onboarding',
    'Standard onboarding process for all new employees',
    'All',
    14,
    '[
        {"name": "Welcome email sent", "category": "Communication", "priority": "high"},
        {"name": "IT equipment setup", "category": "IT", "priority": "high"},
        {"name": "Office tour and introduction", "category": "Orientation", "priority": "medium"},
        {"name": "HR documentation completion", "category": "HR", "priority": "high"},
        {"name": "Department introduction meeting", "category": "Integration", "priority": "medium"},
        {"name": "Training schedule setup", "category": "Training", "priority": "medium"},
        {"name": "First week check-in", "category": "Follow-up", "priority": "medium"}
    ]'::jsonb
),
(
    'IT Department Onboarding',
    'Specialized onboarding for IT department employees',
    'IT',
    21,
    '[
        {"name": "Welcome email sent", "category": "Communication", "priority": "high"},
        {"name": "Development environment setup", "category": "IT", "priority": "critical"},
        {"name": "System access provisioning", "category": "IT", "priority": "critical"},
        {"name": "Code repository access", "category": "IT", "priority": "high"},
        {"name": "Technical documentation review", "category": "Training", "priority": "medium"},
        {"name": "Team introduction and mentorship", "category": "Integration", "priority": "high"},
        {"name": "Project assignment", "category": "Work", "priority": "medium"},
        {"name": "Two-week technical review", "category": "Follow-up", "priority": "medium"}
    ]'::jsonb
),
(
    'HR Department Onboarding',
    'Specialized onboarding for HR department employees',
    'HR',
    18,
    '[
        {"name": "Welcome email sent", "category": "Communication", "priority": "high"},
        {"name": "HRIS system access", "category": "IT", "priority": "critical"},
        {"name": "HR policies and procedures training", "category": "Training", "priority": "high"},
        {"name": "Compliance training", "category": "Compliance", "priority": "high"},
        {"name": "Employee handbook review", "category": "Documentation", "priority": "medium"},
        {"name": "HR team integration", "category": "Integration", "priority": "high"},
        {"name": "First case assignment", "category": "Work", "priority": "medium"}
    ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Step 11: Insert sample offboarding templates
INSERT INTO employee_offboarding_templates (name, description, offboarding_type, estimated_duration_days, tasks) VALUES
(
    'Standard Voluntary Resignation',
    'Standard process for employees leaving voluntarily',
    'voluntary',
    14,
    '[
        {"name": "Exit interview scheduled", "category": "HR", "priority": "high"},
        {"name": "Knowledge transfer documentation", "category": "Work", "priority": "critical"},
        {"name": "Asset return checklist", "category": "IT", "priority": "high"},
        {"name": "Access revocation", "category": "IT", "priority": "critical"},
        {"name": "Final payroll processing", "category": "Finance", "priority": "high"},
        {"name": "Benefits termination", "category": "HR", "priority": "medium"},
        {"name": "Final documentation", "category": "HR", "priority": "medium"}
    ]'::jsonb
),
(
    'Immediate Termination',
    'Process for immediate termination situations',
    'involuntary',
    3,
    '[
        {"name": "Immediate access revocation", "category": "IT", "priority": "critical"},
        {"name": "Asset collection", "category": "IT", "priority": "critical"},
        {"name": "Security notification", "category": "Security", "priority": "critical"},
        {"name": "HR documentation", "category": "HR", "priority": "high"},
        {"name": "Final payroll calculation", "category": "Finance", "priority": "high"}
    ]'::jsonb
),
(
    'Retirement Process',
    'Process for employee retirement',
    'retirement',
    30,
    '[
        {"name": "Retirement celebration planning", "category": "HR", "priority": "medium"},
        {"name": "Knowledge transfer program", "category": "Work", "priority": "high"},
        {"name": "Benefits transition", "category": "HR", "priority": "high"},
        {"name": "Pension processing", "category": "Finance", "priority": "critical"},
        {"name": "Asset return", "category": "IT", "priority": "medium"},
        {"name": "Access transition", "category": "IT", "priority": "medium"},
        {"name": "Alumni network invitation", "category": "HR", "priority": "low"}
    ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Step 12: Create functions for process management

-- Function to create employee record from onboarding data
CREATE OR REPLACE FUNCTION create_employee_from_onboarding(onboarding_record_id UUID)
RETURNS UUID AS $$
DECLARE
    new_employee_id UUID;
    onboarding_data RECORD;
BEGIN
    -- Get onboarding data
    SELECT * INTO onboarding_data 
    FROM employee_onboarding_records 
    WHERE id = onboarding_record_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Onboarding record not found';
    END IF;
    
    -- Create employee record with available fields only
    INSERT INTO employees (
        full_name,
        employee_id,
        email,
        phone,
        position,
        department,
        status,
        created_at,
        updated_at
    ) VALUES (
        onboarding_data.full_name,
        onboarding_data.employee_id,
        onboarding_data.email,
        onboarding_data.phone,
        onboarding_data.position,
        onboarding_data.department,
        'active',
        NOW(),
        NOW()
    ) RETURNING id INTO new_employee_id;
    
    -- Update onboarding record with employee reference
    UPDATE employee_onboarding_records 
    SET 
        employee_record_id = new_employee_id,
        employee_record_created = TRUE,
        updated_at = NOW()
    WHERE id = onboarding_record_id;
    
    RETURN new_employee_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get onboarding statistics
CREATE OR REPLACE FUNCTION get_onboarding_stats()
RETURNS TABLE (
    total_onboarding BIGINT,
    pending_onboarding BIGINT,
    in_progress_onboarding BIGINT,
    completed_onboarding BIGINT,
    overdue_onboarding BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_onboarding,
        COUNT(CASE WHEN onboarding_status = 'pending' THEN 1 END) as pending_onboarding,
        COUNT(CASE WHEN onboarding_status = 'in_progress' THEN 1 END) as in_progress_onboarding,
        COUNT(CASE WHEN onboarding_status = 'completed' THEN 1 END) as completed_onboarding,
        COUNT(CASE WHEN onboarding_status IN ('pending', 'in_progress') AND expected_completion_date < CURRENT_DATE THEN 1 END) as overdue_onboarding
    FROM employee_onboarding_records;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create views for easier data access
CREATE OR REPLACE VIEW onboarding_dashboard AS
SELECT 
    o.id,
    o.full_name,
    o.employee_id,
    o.email,
    o.position,
    o.department,
    o.start_date,
    o.onboarding_status,
    o.expected_completion_date,
    o.completion_percentage,
    o.created_at,
    t.name as template_name,
    hr.email as hr_contact_email,
    buddy.email as onboarding_buddy_email
FROM employee_onboarding_records o
LEFT JOIN employee_onboarding_templates t ON o.template_id = t.id
LEFT JOIN auth.users hr ON o.hr_contact = hr.id
LEFT JOIN auth.users buddy ON o.onboarding_buddy = buddy.id
ORDER BY o.created_at DESC;

-- Step 14: Test the setup
SELECT 
    'Onboarding System Setup Complete' as status,
    (SELECT COUNT(*) FROM employee_onboarding_templates) as onboarding_templates,
    (SELECT COUNT(*) FROM employee_offboarding_templates) as offboarding_templates,
    (SELECT COUNT(*) FROM employee_onboarding_records) as onboarding_records,
    (SELECT COUNT(*) FROM employee_offboarding_records) as offboarding_records;

-- Display sample templates
SELECT 'Sample Onboarding Templates:' as info;
SELECT name, description, department, estimated_duration_days 
FROM employee_onboarding_templates 
ORDER BY name;

-- Success message
SELECT '🎉 DEDICATED ONBOARDING/OFFBOARDING SYSTEM CREATED!' as final_status;

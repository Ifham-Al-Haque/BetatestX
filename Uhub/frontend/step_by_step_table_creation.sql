-- Step-by-step table creation to fix the error
-- Run these commands one by one in Supabase SQL Editor

-- Step 1: Create the main offboarding records table first
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

-- Step 2: Enable RLS on the table
ALTER TABLE employee_offboarding_records ENABLE ROW LEVEL SECURITY;

-- Step 3: Create basic RLS policies
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

CREATE POLICY "offboarding_records_update_policy" ON employee_offboarding_records
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'it_management')
        )
    );

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_offboarding_records_employee_id ON employee_offboarding_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_records_status ON employee_offboarding_records(status);

-- Step 5: Verify the table was created
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'employee_offboarding_records';

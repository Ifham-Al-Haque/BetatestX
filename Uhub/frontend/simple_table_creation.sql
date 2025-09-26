-- Simple table creation without foreign keys first
-- Run this in Supabase SQL Editor

-- Create the table without foreign key constraints first
CREATE TABLE IF NOT EXISTS employee_offboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID,
    last_working_date DATE NOT NULL,
    termination_date DATE,
    reason_for_leaving VARCHAR(100),
    reason_details TEXT,
    exit_interview_date DATE,
    exit_interview_conducted_by UUID,
    exit_interview_notes TEXT,
    status VARCHAR(50) DEFAULT 'in_progress',
    progress_percentage INTEGER DEFAULT 0,
    hr_contact UUID,
    department_manager UUID,
    handover_to UUID,
    final_payroll_processed BOOLEAN DEFAULT FALSE,
    final_payroll_date DATE,
    benefits_terminated BOOLEAN DEFAULT FALSE,
    benefits_termination_date DATE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify table was created
SELECT 'Table created successfully' as message, 
       COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'employee_offboarding_records';

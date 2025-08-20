-- Enhanced Employee Management System Database Updates
-- Run this in your Supabase SQL Editor

-- 1. Add new columns to existing employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS termination_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,1) CHECK (performance_rating >= 0 AND performance_rating <= 5);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS next_of_kin_relationship VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS training_records JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS data_completeness_score INTEGER DEFAULT 0;

-- 2. Create employee_documents table
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES employees(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at DATE,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create employee_work_history table
CREATE TABLE IF NOT EXISTS employee_work_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  salary DECIMAL(10,2),
  reason_for_change VARCHAR(255),
  performance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create employee_performance_reviews table
CREATE TABLE IF NOT EXISTS employee_performance_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id),
  review_date DATE NOT NULL,
  review_period VARCHAR(50) NOT NULL,
  overall_rating DECIMAL(3,1) CHECK (overall_rating >= 0 AND overall_rating <= 5),
  goals_achieved INTEGER,
  goals_total INTEGER,
  strengths TEXT,
  areas_for_improvement TEXT,
  action_plan TEXT,
  next_review_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create employee_leave_requests table
CREATE TABLE IF NOT EXISTS employee_leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create employee_onboarding table
CREATE TABLE IF NOT EXISTS employee_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  checklist_item VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES employees(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create employee_offboarding table
CREATE TABLE IF NOT EXISTS employee_offboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  exit_interview_date DATE,
  exit_interview_conducted_by UUID REFERENCES employees(id),
  reason_for_leaving TEXT,
  assets_returned BOOLEAN DEFAULT FALSE,
  access_revoked BOOLEAN DEFAULT FALSE,
  final_payroll_processed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create employee_skills table
CREATE TABLE IF NOT EXISTS employee_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  skill_level VARCHAR(50) NOT NULL,
  years_of_experience INTEGER,
  certified BOOLEAN DEFAULT FALSE,
  certification_name VARCHAR(255),
  certification_expiry DATE,
  verified_by UUID REFERENCES employees(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create employee_goals table
CREATE TABLE IF NOT EXISTS employee_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  goal_title VARCHAR(255) NOT NULL,
  goal_description TEXT,
  goal_type VARCHAR(100) NOT NULL,
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  search_name VARCHAR(255) NOT NULL,
  search_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES employees(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Create employee_attendance table
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  total_hours DECIMAL(4,2),
  status VARCHAR(50) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_offboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_history_employee_id ON employee_work_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_reviews_employee_id ON employee_performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_employee_id ON employee_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_employee_id ON employee_onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_offboarding_employee_id ON employee_offboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_goals_employee_id ON employee_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_date ON employee_attendance(employee_id, date);

-- Create RLS policies (basic policies - adjust based on your security requirements)
-- Employee Documents
CREATE POLICY "Users can view their own documents" ON employee_documents
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can insert their own documents" ON employee_documents
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- Employee Work History
CREATE POLICY "Users can view their own work history" ON employee_work_history
  FOR SELECT USING (auth.uid()::text = employee_id::text);

-- Employee Performance Reviews
CREATE POLICY "Users can view their own performance reviews" ON employee_performance_reviews
  FOR SELECT USING (auth.uid()::text = employee_id::text);

-- Employee Leave Requests
CREATE POLICY "Users can view their own leave requests" ON employee_leave_requests
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can insert their own leave requests" ON employee_leave_requests
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- Employee Skills
CREATE POLICY "Users can view their own skills" ON employee_skills
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can insert their own skills" ON employee_skills
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- Employee Goals
CREATE POLICY "Users can view their own goals" ON employee_goals
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Users can insert their own goals" ON employee_goals
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- Saved Searches
CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own saved searches" ON saved_searches
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Employee Attendance
CREATE POLICY "Users can view their own attendance" ON employee_attendance
  FOR SELECT USING (auth.uid()::text = employee_id::text);

-- Create functions for data completeness calculation
CREATE OR REPLACE FUNCTION calculate_employee_data_completeness(emp_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 20;
  filled_fields INTEGER := 0;
  emp_record RECORD;
BEGIN
  SELECT * INTO emp_record FROM employees WHERE id = emp_id;
  
  IF emp_record.full_name IS NOT NULL AND emp_record.full_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.email IS NOT NULL AND emp_record.email != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.phone IS NOT NULL AND emp_record.phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.department IS NOT NULL AND emp_record.department != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.position IS NOT NULL AND emp_record.position != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.employee_id IS NOT NULL AND emp_record.employee_id != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.hire_date IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.location IS NOT NULL AND emp_record.location != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.emergency_contact_name IS NOT NULL AND emp_record.emergency_contact_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.emergency_contact_phone IS NOT NULL AND emp_record.emergency_contact_phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.next_of_kin_name IS NOT NULL AND emp_record.next_of_kin_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.next_of_kin_phone IS NOT NULL AND emp_record.next_of_kin_phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.salary IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.performance_rating IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.experience_level IS NOT NULL AND emp_record.experience_level != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.summary IS NOT NULL AND emp_record.summary != '' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.scopes IS NOT NULL AND emp_record.scopes != '[]' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.responsibilities IS NOT NULL AND emp_record.responsibilities != '[]' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.duties IS NOT NULL AND emp_record.duties != '[]' THEN filled_fields := filled_fields + 1; END IF;
  IF emp_record.reporting_manager_id IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  
  RETURN ROUND((filled_fields::DECIMAL / total_fields::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update data completeness score
CREATE OR REPLACE FUNCTION update_employee_data_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_completeness_score = calculate_employee_data_completeness(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_data_completeness
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_data_completeness();

-- Create function for audit logging
CREATE OR REPLACE FUNCTION log_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for employees table
CREATE TRIGGER trigger_audit_employee_changes
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION log_employee_changes();

-- Note: Sample data insertion removed to avoid foreign key constraint errors
-- Sample data should be inserted after actual employees exist in the employees table
-- You can add sample data later using actual employee IDs from your employees table

-- Create view for employee analytics
CREATE OR REPLACE VIEW employee_analytics AS
SELECT 
  e.id,
  e.full_name,
  e.department,
  e.position,
  e.hire_date,
  e.performance_rating,
  e.data_completeness_score,
  e.salary,
  e.status,
  COUNT(ed.id) as document_count,
  COUNT(epr.id) as performance_reviews_count,
  COUNT(es.id) as skills_count,
  COUNT(eg.id) as goals_count,
  COUNT(elr.id) as leave_requests_count
FROM employees e
LEFT JOIN employee_documents ed ON e.id = ed.employee_id
LEFT JOIN employee_performance_reviews epr ON e.id = epr.employee_id
LEFT JOIN employee_skills es ON e.id = es.employee_id
LEFT JOIN employee_goals eg ON e.id = eg.employee_id
LEFT JOIN employee_leave_requests elr ON e.id = elr.employee_id
GROUP BY e.id, e.full_name, e.department, e.position, e.hire_date, e.performance_rating, e.data_completeness_score, e.salary, e.status;

-- Grant necessary permissions
GRANT SELECT ON employee_analytics TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

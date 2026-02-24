-- IT Services Database Schema - CORRECT ARCHITECTURE
-- This schema properly separates users (authentication) from employees (HR records)
-- IT requests reference employees, but access control uses users table

-- 1. Create IT Request Categories table
CREATE TABLE IF NOT EXISTS it_request_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create IT Request Priorities table
CREATE TABLE IF NOT EXISTS it_request_priorities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
  color TEXT,
  sla_hours INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create IT Requests table - CORRECT: References employees table
CREATE TABLE IF NOT EXISTS it_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES it_request_categories(id) ON DELETE SET NULL,
  priority_id UUID REFERENCES it_request_priorities(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES employees(id) ON DELETE CASCADE,  -- CORRECT: Employee who made the request
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,  -- CORRECT: Employee assigned to handle
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'pending_approval', 'resolved', 'closed')),
  request_type TEXT DEFAULT 'it_service' CHECK (request_type IN ('it_service', 'hardware', 'software', 'access', 'maintenance', 'other')),
  estimated_completion_date DATE,
  actual_completion_date DATE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create IT Tickets table - CORRECT: References employees table
CREATE TABLE IF NOT EXISTS it_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  request_id UUID REFERENCES it_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting_for_user', 'waiting_for_third_party', 'resolved', 'closed')),
  priority_id UUID REFERENCES it_request_priorities(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,  -- CORRECT: Employee assigned to handle
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES employees(id) ON DELETE SET NULL,    -- CORRECT: Employee who closed it
  resolution_notes TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create IT Ticket Activities table - CORRECT: References employees table
CREATE TABLE IF NOT EXISTS it_ticket_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES it_tickets(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,  -- CORRECT: Employee who performed action
  action TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create IT Assets table - CORRECT: References employees table
CREATE TABLE IF NOT EXISTS it_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_tag TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  manufacturer TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired', 'lost')),
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,  -- CORRECT: Employee who has the asset
  assigned_at TIMESTAMP WITH TIME ZONE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create IT Asset Assignments table - CORRECT: References employees table
CREATE TABLE IF NOT EXISTS it_asset_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES it_assets(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,  -- CORRECT: Employee who was assigned
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,  -- CORRECT: Employee who assigned it
  returned_to UUID REFERENCES employees(id) ON DELETE SET NULL,  -- CORRECT: Employee who received return
  notes TEXT
);

-- 8. Insert default categories
INSERT INTO it_request_categories (name, description, icon, color) VALUES
  ('Hardware Request', 'Computer, laptop, printer, or other hardware requests', 'computer', '#3b82f6'),
  ('Software Request', 'Software installation, license, or access requests', 'code', '#8b5cf6'),
  ('Access Request', 'System access, permissions, or account requests', 'key', '#059669'),
  ('Maintenance', 'Hardware or software maintenance requests', 'wrench', '#d97706'),
  ('Network Issues', 'Internet, VPN, or network connectivity problems', 'wifi', '#dc2626'),
  ('Email Issues', 'Email configuration or access problems', 'mail', '#7c3aed'),
  ('Other', 'Other IT-related requests', 'help-circle', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- 9. Insert default priorities
INSERT INTO it_request_priorities (name, level, color, sla_hours, description) VALUES
  ('Critical', 1, '#dc2626', 2, 'System down, business critical'),
  ('High', 2, '#d97706', 4, 'High impact on business operations'),
  ('Medium', 3, '#059669', 8, 'Moderate impact on work'),
  ('Low', 4, '#3b82f6', 24, 'Low impact, can wait'),
  ('Very Low', 5, '#6b7280', 72, 'Minimal impact, can wait')
ON CONFLICT (name) DO NOTHING;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_it_tickets_request_id ON it_tickets(request_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_assigned_to ON it_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_tickets_status ON it_tickets(status);
CREATE INDEX IF NOT EXISTS idx_it_tickets_priority_id ON it_tickets(priority_id);

CREATE INDEX IF NOT EXISTS idx_it_assets_assigned_to ON it_assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_assets_status ON it_assets(status);

-- 11. Enable Row Level Security
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_asset_assignments ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS Policies - CORRECT: Use users table for role checks, employees for data

-- Categories and Priorities - Read only for all authenticated users
CREATE POLICY "Allow authenticated users to read categories" ON it_request_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read priorities" ON it_request_priorities
  FOR SELECT TO authenticated USING (true);

-- IT Requests - Users can read all, create their own, update if assigned or admin
CREATE POLICY "Allow authenticated users to read requests" ON it_requests
  FOR SELECT TO authenticated USING (true);

-- CORRECT: Check if current user's employee record matches requester
CREATE POLICY "Allow users to create their own requests" ON it_requests
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN users u ON u.employee_id = e.id
      WHERE e.id = requester_id AND u.id = auth.uid()
    )
  );

-- CORRECT: Check if current user's employee record matches requester
CREATE POLICY "Allow users to update their own requests" ON it_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN users u ON u.employee_id = e.id
      WHERE e.id = requester_id AND u.id = auth.uid()
    )
  );

-- CORRECT: Check if current user's employee record matches assigned_to
CREATE POLICY "Allow assigned users to update requests" ON it_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN users u ON u.employee_id = e.id
      WHERE e.id = assigned_to AND u.id = auth.uid()
    )
  );

-- CORRECT: Use users table for role check (admin/it_management roles)
CREATE POLICY "Allow admins to update all requests" ON it_requests
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'it_management')
    )
  );

-- IT Tickets - Similar policies as requests
CREATE POLICY "Allow authenticated users to read tickets" ON it_tickets
  FOR SELECT TO authenticated USING (true);

-- CORRECT: Check if current user's employee record matches assigned_to
CREATE POLICY "Allow assigned users to update tickets" ON it_tickets
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN users u ON u.employee_id = e.id
      WHERE e.id = assigned_to AND u.id = auth.uid()
    )
  );

-- CORRECT: Use users table for role check
CREATE POLICY "Allow admins to update all tickets" ON it_tickets
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'it_management')
    )
  );

-- IT Assets - Read for all, modify for admins and IT managers
CREATE POLICY "Allow authenticated users to read assets" ON it_assets
  FOR SELECT TO authenticated USING (true);

-- CORRECT: Use users table for role check
CREATE POLICY "Allow admins and IT managers to modify assets" ON it_assets
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'it_management')
    )
  );

-- 13. Create functions for common operations

-- Function to generate request number
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'ITR-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                      LPAD(EXTRACT(MONTH FROM NOW())::text, 2, '0') || '-' ||
                      LPAD((SELECT COUNT(*) + 1 FROM it_requests 
                           WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
                           AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()))::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'ITT-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                      LPAD(EXTRACT(MONTH FROM NOW())::text, 2, '0') || '-' ||
                      LPAD((SELECT COUNT(*) + 1 FROM it_tickets 
                           WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
                           AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()))::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update ticket status timestamps
CREATE OR REPLACE FUNCTION update_ticket_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set started_at when status changes to 'in_progress'
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.started_at = NOW();
  END IF;
  
  -- Set resolved_at when status changes to 'resolved'
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  -- Set closed_at when status changes to 'closed'
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create triggers
CREATE TRIGGER trigger_generate_request_number
  BEFORE INSERT ON it_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();

CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON it_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

CREATE TRIGGER trigger_update_ticket_timestamps
  BEFORE UPDATE ON it_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamps();

-- 15. Create view for IT dashboard
CREATE OR REPLACE VIEW it_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM it_requests WHERE status = 'open') as open_requests,
  (SELECT COUNT(*) FROM it_requests WHERE status = 'in_progress') as in_progress_requests,
  (SELECT COUNT(*) FROM it_requests WHERE status = 'pending_approval') as pending_approval_requests,
  (SELECT COUNT(*) FROM it_tickets WHERE status = 'open') as open_tickets,
  (SELECT COUNT(*) FROM it_tickets WHERE status = 'in_progress') as in_progress_tickets,
  (SELECT COUNT(*) FROM it_tickets WHERE status = 'resolved') as resolved_tickets,
  (SELECT COUNT(*) FROM it_assets WHERE status = 'assigned') as assigned_assets,
  (SELECT COUNT(*) FROM it_assets WHERE status = 'available') as available_assets;

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 17. Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_it_ticket_activities_ticket_id ON it_ticket_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_it_ticket_activities_employee_id ON it_ticket_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_it_asset_assignments_asset_id ON it_asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_it_asset_assignments_employee_id ON it_asset_assignments(employee_id);

-- Success message
SELECT 'IT Services schema created successfully with CORRECT architecture! 
- IT requests reference employees table (HR records)
- Access control uses users table (authentication/roles)
- All tables, policies, and functions are ready.' as status;

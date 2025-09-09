-- Fix IT Request Database - Create Missing Views and Functions
-- This script fixes the IT Request system by creating missing database objects

-- 1. Create the missing it_request_details view
CREATE OR REPLACE VIEW it_request_details AS
SELECT 
  ir.id,
  ir.request_number,
  ir.title,
  ir.description,
  ir.status,
  ir.request_type,
  ir.estimated_completion_date,
  ir.actual_completion_date,
  ir.resolution_notes,
  ir.created_at,
  ir.updated_at,
  ir.requester_id,
  ir.assigned_to,
  ir.category_id,
  ir.priority_id,
  -- Requester information
  requester.full_name as requester_name,
  requester.email as requester_email,
  requester.avatar_url as requester_avatar,
  -- Assigned user information
  assigned.full_name as assigned_name,
  assigned.email as assigned_email,
  assigned.avatar_url as assigned_avatar,
  -- Category information
  cat.name as category_name,
  cat.description as category_description,
  cat.icon as category_icon,
  cat.color as category_color,
  -- Priority information
  pri.name as priority_name,
  pri.level as priority_level,
  pri.color as priority_color,
  pri.sla_hours as priority_sla_hours,
  pri.description as priority_description
FROM it_requests ir
LEFT JOIN users requester ON ir.requester_id = requester.id
LEFT JOIN users assigned ON ir.assigned_to = assigned.id
LEFT JOIN it_request_categories cat ON ir.category_id = cat.id
LEFT JOIN it_request_priorities pri ON ir.priority_id = pri.id;

-- 2. Create the missing get_it_request_stats function
CREATE OR REPLACE FUNCTION get_it_request_stats(
  user_id UUID DEFAULT NULL,
  user_role TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  open_requests BIGINT,
  assigned_requests BIGINT,
  in_progress_requests BIGINT,
  pending_user_requests BIGINT,
  resolved_requests BIGINT,
  closed_requests BIGINT,
  cancelled_requests BIGINT,
  my_requests BIGINT,
  assigned_to_me BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'open') as open_requests,
    COUNT(*) FILTER (WHERE status = 'assigned') as assigned_requests,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_requests,
    COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_user_requests,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_requests,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_requests,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_requests,
    COUNT(*) FILTER (WHERE requester_id = user_id) as my_requests,
    COUNT(*) FILTER (WHERE assigned_to = user_id) as assigned_to_me
  FROM it_requests
  WHERE 
    (user_role = 'employee' AND requester_id = user_id) OR
    (user_role IN ('admin', 'it_management', 'tech_support') OR user_role IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create missing IT Request Comments table
CREATE TABLE IF NOT EXISTS it_request_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES it_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create missing IT Request Attachments table
CREATE TABLE IF NOT EXISTS it_request_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES it_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create missing IT Tickets API methods
CREATE TABLE IF NOT EXISTS it_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  request_id UUID REFERENCES it_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting_for_user', 'waiting_for_third_party', 'resolved', 'closed')),
  priority_id UUID REFERENCES it_request_priorities(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add missing columns to it_requests table
ALTER TABLE it_requests 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_it_request_comments_request_id ON it_request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_it_request_comments_user_id ON it_request_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_it_request_attachments_request_id ON it_request_attachments(request_id);
CREATE INDEX IF NOT EXISTS idx_it_request_attachments_user_id ON it_request_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_request_id ON it_tickets(request_id);
CREATE INDEX IF NOT EXISTS idx_it_tickets_assigned_to ON it_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_tickets_status ON it_tickets(status);

-- 8. Enable RLS on new tables
ALTER TABLE it_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_tickets ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for new tables
CREATE POLICY "Allow authenticated users to read comments" ON it_request_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to create comments" ON it_request_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own comments" ON it_request_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated users to read attachments" ON it_request_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to create attachments" ON it_request_attachments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own attachments" ON it_request_attachments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated users to read tickets" ON it_tickets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow assigned users to update tickets" ON it_tickets
  FOR UPDATE TO authenticated USING (assigned_to = auth.uid());

CREATE POLICY "Allow admins to manage all tickets" ON it_tickets
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'it_management')
    )
  );

-- 10. Create function to generate ticket number
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

-- 11. Create trigger for ticket number generation
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON it_tickets;
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON it_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- 12. Grant permissions
GRANT SELECT ON it_request_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_it_request_stats TO authenticated;
GRANT ALL ON it_request_comments TO authenticated;
GRANT ALL ON it_request_attachments TO authenticated;
GRANT ALL ON it_tickets TO authenticated;

-- Success message
SELECT 'IT Request database fixes applied successfully! All missing views, functions, and tables are now created.' as status;

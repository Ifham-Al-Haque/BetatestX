-- Safe Fix for IT Requests - Handles Existing Objects
-- This script safely creates the basic tables needed for IT Requests

-- 1. Create IT Request Categories table (if not exists)
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

-- 2. Create IT Request Priorities table (if not exists)
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

-- 3. Create IT Requests table (if not exists)
CREATE TABLE IF NOT EXISTS it_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES it_request_categories(id) ON DELETE SET NULL,
  priority_id UUID REFERENCES it_request_priorities(id) ON DELETE SET NULL,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'pending_approval', 'resolved', 'closed')),
  request_type TEXT DEFAULT 'it_service' CHECK (request_type IN ('it_service', 'hardware', 'software', 'access', 'maintenance', 'other')),
  estimated_completion_date DATE,
  actual_completion_date DATE,
  resolution_notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default categories (if not exist)
INSERT INTO it_request_categories (name, description, icon, color) VALUES
  ('Hardware Request', 'Computer, laptop, printer, or other hardware requests', 'computer', '#3b82f6'),
  ('Software Request', 'Software installation, license, or access requests', 'code', '#8b5cf6'),
  ('Access Request', 'System access, permissions, or account requests', 'key', '#059669'),
  ('Maintenance', 'Hardware or software maintenance requests', 'wrench', '#d97706'),
  ('Network Issues', 'Internet, VPN, or network connectivity problems', 'wifi', '#dc2626'),
  ('Email Issues', 'Email configuration or access problems', 'mail', '#7c3aed'),
  ('Other', 'Other IT-related requests', 'help-circle', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert default priorities (if not exist)
INSERT INTO it_request_priorities (name, level, color, sla_hours, description) VALUES
  ('Critical', 1, '#dc2626', 2, 'System down, business critical'),
  ('High', 2, '#d97706', 4, 'High impact on business operations'),
  ('Medium', 3, '#059669', 8, 'Moderate impact on work'),
  ('Low', 4, '#3b82f6', 24, 'Low impact, can wait'),
  ('Very Low', 5, '#6b7280', 72, 'Minimal impact, can wait')
ON CONFLICT (name) DO NOTHING;

-- 6. Create indexes for better performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

-- 7. Enable Row Level Security (if not already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'it_request_categories' AND relrowsecurity = true
  ) THEN
    ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'it_request_priorities' AND relrowsecurity = true
  ) THEN
    ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'it_requests' AND relrowsecurity = true
  ) THEN
    ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 8. Create RLS Policies (only if they don't exist)
DO $$ 
BEGIN
  -- Categories policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_request_categories' AND policyname = 'Allow authenticated users to read categories'
  ) THEN
    CREATE POLICY "Allow authenticated users to read categories" ON it_request_categories
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Priorities policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_request_priorities' AND policyname = 'Allow authenticated users to read priorities'
  ) THEN
    CREATE POLICY "Allow authenticated users to read priorities" ON it_request_priorities
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- IT Requests policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_requests' AND policyname = 'Allow authenticated users to read requests'
  ) THEN
    CREATE POLICY "Allow authenticated users to read requests" ON it_requests
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_requests' AND policyname = 'Allow users to create their own requests'
  ) THEN
    CREATE POLICY "Allow users to create their own requests" ON it_requests
      FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_requests' AND policyname = 'Allow users to update their own requests'
  ) THEN
    CREATE POLICY "Allow users to update their own requests" ON it_requests
      FOR UPDATE TO authenticated USING (requester_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_requests' AND policyname = 'Allow assigned users to update requests'
  ) THEN
    CREATE POLICY "Allow assigned users to update requests" ON it_requests
      FOR UPDATE TO authenticated USING (assigned_to = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'it_requests' AND policyname = 'Allow admins to update all requests'
  ) THEN
    CREATE POLICY "Allow admins to update all requests" ON it_requests
      FOR UPDATE TO authenticated USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role IN ('admin', 'it_management')
        )
      );
  END IF;
END $$;

-- 9. Create function to generate request number (if not exists)
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

-- 10. Create trigger for request number generation (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_request_number'
  ) THEN
    CREATE TRIGGER trigger_generate_request_number
      BEFORE INSERT ON it_requests
      FOR EACH ROW
      EXECUTE FUNCTION generate_request_number();
  END IF;
END $$;

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON it_request_categories TO authenticated;
GRANT ALL ON it_request_priorities TO authenticated;
GRANT ALL ON it_requests TO authenticated;
GRANT EXECUTE ON FUNCTION generate_request_number TO authenticated;

-- Success message
SELECT 'IT Requests setup completed safely! All existing objects were preserved.' as status;

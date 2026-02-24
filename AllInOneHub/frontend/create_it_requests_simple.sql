-- Simple IT Requests Table Creation Script
-- This script creates the basic IT request management system

-- Create IT Request Categories Table
CREATE TABLE IF NOT EXISTS it_request_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'settings',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create IT Request Priorities Table
CREATE TABLE IF NOT EXISTS it_request_priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    sla_hours INTEGER DEFAULT 72,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create IT Requests Table
CREATE TABLE IF NOT EXISTS it_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(50) NOT NULL DEFAULT 'it_service',
    category_id UUID NOT NULL,
    priority_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_user', 'resolved', 'closed', 'cancelled')),
    requester_id UUID NOT NULL,
    assigned_to UUID,
    assigned_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    closed_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_category 
FOREIGN KEY (category_id) REFERENCES it_request_categories(id) ON DELETE RESTRICT;

ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_priority 
FOREIGN KEY (priority_id) REFERENCES it_request_priorities(id) ON DELETE RESTRICT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_it_requests_request_type ON it_requests(request_type);

-- Insert default categories if they don't exist
INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
('Hardware', 'Computer hardware issues and requests', '#EF4444', 'monitor', 1),
('Software', 'Software installation and configuration', '#10B981', 'code', 2),
('Network', 'Network connectivity and access issues', '#3B82F6', 'wifi', 3),
('Email', 'Email and communication issues', '#8B5CF6', 'mail', 4),
('Access Control', 'User access and permissions', '#F59E0B', 'key', 5),
('Printing', 'Printer and printing issues', '#6B7280', 'printer', 6),
('Security', 'Security-related requests', '#DC2626', 'shield', 7),
('Other', 'Other IT-related requests', '#9CA3AF', 'help-circle', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert default priorities if they don't exist
INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
('Critical', 1, 'System down or major security issue', '#DC2626', 2),
('High', 2, 'Business critical functionality affected', '#EF4444', 4),
('Medium', 3, 'Standard business request', '#F59E0B', 24),
('Low', 4, 'Non-urgent request', '#10B981', 72),
('Info', 5, 'Information request only', '#6B7280', 168)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for it_request_categories (read-only for all authenticated users)
CREATE POLICY IF NOT EXISTS "All users can view categories" ON it_request_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for it_request_priorities (read-only for all authenticated users)
CREATE POLICY IF NOT EXISTS "All users can view priorities" ON it_request_priorities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for it_requests
CREATE POLICY IF NOT EXISTS "Users can view own requests" ON it_requests
    FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY IF NOT EXISTS "Tech roles and admins can view all requests" ON it_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );

CREATE POLICY IF NOT EXISTS "Users can create own requests" ON it_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY IF NOT EXISTS "Users can update own open requests" ON it_requests
    FOR UPDATE USING (auth.uid() = requester_id AND status IN ('open', 'pending_user'));

CREATE POLICY IF NOT EXISTS "Tech roles and admins can update all requests" ON it_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );

CREATE POLICY IF NOT EXISTS "Users can delete own open requests" ON it_requests
    FOR DELETE USING (auth.uid() = requester_id AND status = 'open');

CREATE POLICY IF NOT EXISTS "Tech roles and admins can delete any request" ON it_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_it_requests_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_it_requests_updated_at ON it_requests;
CREATE TRIGGER trigger_update_it_requests_updated_at
    BEFORE UPDATE ON it_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_it_requests_updated_at();

-- Grant necessary permissions
GRANT ALL ON it_request_categories TO authenticated;
GRANT ALL ON it_request_priorities TO authenticated;
GRANT ALL ON it_requests TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE it_requests IS 'Stores IT service requests with role-based access control';
COMMENT ON TABLE it_request_categories IS 'Categories for IT service requests';
COMMENT ON TABLE it_request_priorities IS 'Priority levels for IT service requests';

-- Final verification
SELECT 
    'IT Requests system setup completed successfully' as status,
    (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('it_requests', 'it_request_categories', 'it_request_priorities')) as policies_count;

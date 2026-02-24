-- Complete IT Requests System Setup
-- This script creates all necessary tables and data for the IT requests system
-- Run this in your Supabase SQL editor

-- Step 1: Create IT Request Categories table
DROP TABLE IF EXISTS it_request_categories CASCADE;
CREATE TABLE it_request_categories (
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

-- Step 2: Create IT Request Priorities table
DROP TABLE IF EXISTS it_request_priorities CASCADE;
CREATE TABLE it_request_priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    sla_hours INTEGER DEFAULT 72,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create IT Requests table
DROP TABLE IF EXISTS it_requests CASCADE;
CREATE TABLE it_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(50) NOT NULL DEFAULT 'it_service',
    category_id UUID NOT NULL REFERENCES it_request_categories(id) ON DELETE RESTRICT,
    priority_id UUID NOT NULL REFERENCES it_request_priorities(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_user', 'resolved', 'closed', 'cancelled')),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create IT Request Comments table
DROP TABLE IF EXISTS it_request_comments CASCADE;
CREATE TABLE it_request_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES it_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create IT Request Attachments table
DROP TABLE IF EXISTS it_request_attachments CASCADE;
CREATE TABLE it_request_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES it_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX idx_it_requests_status ON it_requests(status);
CREATE INDEX idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX idx_it_requests_created_at ON it_requests(created_at);
CREATE INDEX idx_it_requests_request_type ON it_requests(request_type);
CREATE INDEX idx_it_request_comments_request_id ON it_request_comments(request_id);
CREATE INDEX idx_it_request_attachments_request_id ON it_request_attachments(request_id);

-- Step 7: Enable RLS
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_attachments ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies

-- Categories and Priorities - Everyone can read
CREATE POLICY "Everyone can view categories" ON it_request_categories FOR SELECT USING (true);
CREATE POLICY "Everyone can view priorities" ON it_request_priorities FOR SELECT USING (true);

-- IT Requests policies
CREATE POLICY "Users can view own requests" ON it_requests 
    FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Users can create requests" ON it_requests 
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own requests" ON it_requests 
    FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Admins can view all requests" ON it_requests 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Admins can manage all requests" ON it_requests 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- Comments policies
CREATE POLICY "Users can view request comments" ON it_request_comments 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM it_requests r 
            WHERE r.id = request_id 
            AND (r.requester_id = auth.uid() OR r.assigned_to = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Users can create comments" ON it_request_comments 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attachments policies
CREATE POLICY "Users can view request attachments" ON it_request_attachments 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM it_requests r 
            WHERE r.id = request_id 
            AND (r.requester_id = auth.uid() OR r.assigned_to = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "Users can upload attachments" ON it_request_attachments 
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Step 9: Create function to generate request numbers
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    year_part TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM it_requests
    WHERE request_number LIKE 'REQ' || year_part || '%';
    
    RETURN 'REQ' || year_part || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to auto-generate request numbers
CREATE OR REPLACE FUNCTION set_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
        NEW.request_number := generate_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_request_number
    BEFORE INSERT ON it_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_request_number();

-- Step 11: Insert default categories
INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
('Hardware', 'Computer hardware, peripherals, and equipment requests', '#EF4444', 'monitor', 1),
('Software', 'Software installation, updates, and licensing', '#3B82F6', 'download', 2),
('Network', 'Network connectivity, VPN, and internet issues', '#10B981', 'wifi', 3),
('Access', 'Account creation, permissions, and access requests', '#F59E0B', 'key', 4),
('Email', 'Email setup, issues, and configuration', '#8B5CF6', 'mail', 5),
('Phone', 'Phone systems, extensions, and mobile devices', '#06B6D4', 'phone', 6),
('Printer', 'Printer setup, maintenance, and troubleshooting', '#84CC16', 'printer', 7),
('Security', 'Security software, antivirus, and security issues', '#DC2626', 'shield', 8),
('Backup', 'Data backup, recovery, and storage requests', '#059669', 'hard-drive', 9),
('Other', 'General IT requests and miscellaneous issues', '#6B7280', 'help-circle', 10)
ON CONFLICT (name) DO NOTHING;

-- Step 12: Insert default priorities
INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
('Critical', 1, 'System down, business critical issue', '#DC2626', 4),
('High', 2, 'Major functionality affected, urgent resolution needed', '#EA580C', 24),
('Medium', 3, 'Standard request, moderate impact', '#D97706', 72),
('Low', 4, 'Minor issue, can be scheduled', '#65A30D', 168),
('Planning', 5, 'Future planning, no immediate action required', '#6B7280', 720)
ON CONFLICT (name) DO NOTHING;

-- Step 13: Create function to get IT request statistics
CREATE OR REPLACE FUNCTION get_it_request_stats(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_requests BIGINT,
    open_requests BIGINT,
    in_progress_requests BIGINT,
    resolved_requests BIGINT,
    avg_resolution_hours NUMERIC,
    overdue_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_requests,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_requests,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_requests,
        COALESCE(AVG(
            CASE 
                WHEN actual_completion_date IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (actual_completion_date - created_at)) / 3600 
            END
        ), 0) as avg_resolution_hours,
        COUNT(CASE 
            WHEN status IN ('open', 'in_progress') 
            AND estimated_completion_date < CURRENT_DATE 
            THEN 1 
        END) as overdue_requests
    FROM it_requests r
    WHERE user_id_param IS NULL OR r.requester_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create sample data for testing
DO $$
DECLARE
    cat_hardware UUID;
    cat_software UUID;
    prio_medium UUID;
    prio_high UUID;
    admin_user UUID;
BEGIN
    -- Get category and priority IDs
    SELECT id INTO cat_hardware FROM it_request_categories WHERE name = 'Hardware' LIMIT 1;
    SELECT id INTO cat_software FROM it_request_categories WHERE name = 'Software' LIMIT 1;
    SELECT id INTO prio_medium FROM it_request_priorities WHERE name = 'Medium' LIMIT 1;
    SELECT id INTO prio_high FROM it_request_priorities WHERE name = 'High' LIMIT 1;
    
    -- Get admin user (create one if doesn't exist)
    SELECT auth_user_id INTO admin_user FROM users WHERE role = 'admin' LIMIT 1;
    
    IF admin_user IS NOT NULL THEN
        -- Insert sample requests
        INSERT INTO it_requests (
            title, description, category_id, priority_id, 
            requester_id, status, request_type
        ) VALUES
        (
            'New laptop request',
            'Need a new laptop for development work. Current laptop is running slow and outdated.',
            cat_hardware,
            prio_medium,
            admin_user,
            'open',
            'hardware'
        ),
        (
            'Software installation - Adobe Creative Suite',
            'Need Adobe Creative Suite installed for marketing department work.',
            cat_software,
            prio_high,
            admin_user,
            'in_progress',
            'software'
        );
        
        RAISE NOTICE 'Sample IT requests created successfully';
    ELSE
        RAISE NOTICE 'No admin user found, skipping sample data creation';
    END IF;
END $$;

-- Step 15: Verify setup
SELECT 
    'IT Requests System Setup Complete' as status,
    (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    (SELECT COUNT(*) FROM it_requests) as requests_count;

-- Display sample data
SELECT 'Sample Categories:' as info;
SELECT name, description, color, icon FROM it_request_categories ORDER BY sort_order;

SELECT 'Sample Priorities:' as info;
SELECT name, level, description, color, sla_hours FROM it_request_priorities ORDER BY level;

SELECT 'Sample Requests:' as info;
SELECT 
    request_number,
    title,
    status,
    created_at
FROM it_requests 
ORDER BY created_at DESC 
LIMIT 5;

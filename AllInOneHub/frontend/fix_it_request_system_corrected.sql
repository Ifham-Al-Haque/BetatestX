-- Fix IT Request System - Corrected for Actual Database Schema
-- This version works with your actual database structure

-- Step 1: Create tables only if they don't exist (safe approach)
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

CREATE TABLE IF NOT EXISTS it_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL DEFAULT ('REQ-' || extract(epoch from now())::text),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(50) NOT NULL DEFAULT 'it_service',
    category_id UUID REFERENCES it_request_categories(id) ON DELETE SET NULL,
    priority_id UUID REFERENCES it_request_priorities(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'pending_approval', 'resolved', 'closed', 'cancelled')),
    requester_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    closed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert sample data only if tables are empty
DO $$
BEGIN
    -- Insert categories if empty
    IF (SELECT COUNT(*) FROM it_request_categories) = 0 THEN
        INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
            ('Hardware', 'Computer, printer, and hardware issues', '#EF4444', 'monitor', 1),
            ('Software', 'Software installation and troubleshooting', '#3B82F6', 'download', 2),
            ('Network', 'Internet and network connectivity issues', '#10B981', 'wifi', 3),
            ('Access', 'Account access and permission requests', '#F59E0B', 'key', 4),
            ('Email', 'Email setup and troubleshooting', '#8B5CF6', 'mail', 5),
            ('Phone', 'Phone and communication issues', '#06B6D4', 'phone', 6),
            ('Security', 'Security and antivirus issues', '#DC2626', 'shield', 7),
            ('Other', 'Other IT-related requests', '#6B7280', 'help-circle', 8);
        RAISE NOTICE 'Sample categories inserted';
    END IF;
    
    -- Insert priorities if empty
    IF (SELECT COUNT(*) FROM it_request_priorities) = 0 THEN
        INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
            ('Critical', 1, 'System down, business critical', '#DC2626', 4),
            ('High', 2, 'Significant impact on productivity', '#F59E0B', 24),
            ('Medium', 3, 'Moderate impact, standard request', '#3B82F6', 72),
            ('Low', 4, 'Minor issue, can wait', '#10B981', 168),
            ('Enhancement', 5, 'Feature request or improvement', '#8B5CF6', 336);
        RAISE NOTICE 'Sample priorities inserted';
    END IF;
END $$;

-- Step 3: Create indexes safely
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

-- Step 4: Enable RLS safely
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read access for categories" ON it_request_categories;
DROP POLICY IF EXISTS "Public read access for priorities" ON it_request_priorities;
DROP POLICY IF EXISTS "Basic IT request access" ON it_requests;
DROP POLICY IF EXISTS "IT request full access" ON it_requests;
DROP POLICY IF EXISTS "Employee can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Admin can view all requests" ON it_requests;

-- Step 6: Create RLS policies that work with your schema
-- Categories and priorities - readable by all authenticated users
CREATE POLICY "Public read access for categories" ON it_request_categories
    FOR SELECT USING (true);

CREATE POLICY "Public read access for priorities" ON it_request_priorities
    FOR SELECT USING (true);

-- IT requests - more sophisticated access control
-- Employees can see their own requests
CREATE POLICY "Employee can view own requests" ON it_requests
    FOR SELECT USING (
        requester_id IN (
            SELECT e.id 
            FROM employees e 
            JOIN users u ON u.employee_id = e.id 
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Employees can create requests for themselves
CREATE POLICY "Employee can create requests" ON it_requests
    FOR INSERT WITH CHECK (
        requester_id IN (
            SELECT e.id 
            FROM employees e 
            JOIN users u ON u.employee_id = e.id 
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- IT staff and admins can see all requests
CREATE POLICY "IT staff can view all requests" ON it_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'it_manager', 'it_technician', 'super_admin')
        )
    );

-- IT staff can update requests
CREATE POLICY "IT staff can update requests" ON it_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'it_manager', 'it_technician', 'super_admin')
        )
    );

-- Step 7: Create helper functions for the API
CREATE OR REPLACE FUNCTION get_it_request_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'open_requests', COUNT(*) FILTER (WHERE status = 'open'),
        'in_progress_requests', COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress')),
        'pending_approval_requests', COUNT(*) FILTER (WHERE status = 'pending_approval'),
        'resolved_requests', COUNT(*) FILTER (WHERE status = 'resolved'),
        'closed_requests', COUNT(*) FILTER (WHERE status = 'closed'),
        'unassigned_requests', COUNT(*) FILTER (WHERE assigned_to IS NULL AND status != 'closed')
    )
    INTO result
    FROM it_requests;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create a view for easier querying
CREATE OR REPLACE VIEW it_requests_with_details AS
SELECT 
    r.*,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    p.name as priority_name,
    p.level as priority_level,
    p.color as priority_color,
    p.sla_hours,
    req.full_name as requester_name,
    req.email as requester_email,
    req.department as requester_department,
    assigned.full_name as assigned_to_name,
    assigned.email as assigned_to_email,
    closed.full_name as closed_by_name
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN employees req ON r.requester_id = req.id
LEFT JOIN employees assigned ON r.assigned_to = assigned.id
LEFT JOIN employees closed ON r.closed_by = closed.id;

-- Step 9: Grant necessary permissions
GRANT SELECT ON it_request_categories TO authenticated;
GRANT SELECT ON it_request_priorities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON it_requests TO authenticated;
GRANT SELECT ON it_requests_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_it_request_stats() TO authenticated;

-- Step 10: Verify setup and show results
SELECT 
    'Setup Complete' as status,
    'Categories: ' || (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    'Priorities: ' || (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    'Requests: ' || (SELECT COUNT(*) FROM it_requests) as requests_count,
    'View created: it_requests_with_details' as view_info,
    'Function created: get_it_request_stats()' as function_info;

-- Show sample data
SELECT 'Sample Categories:' as info, name, color, icon FROM it_request_categories ORDER BY sort_order LIMIT 3;
SELECT 'Sample Priorities:' as info, name, level, color, sla_hours FROM it_request_priorities ORDER BY level LIMIT 3;

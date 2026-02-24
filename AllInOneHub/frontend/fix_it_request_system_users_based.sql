-- Fix IT Request System - Users Based (Correct Architecture)
-- IT requests are raised by UHub account holders (users), not employees directly

-- Step 1: Create tables with correct user-based architecture
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
    
    -- Requester is a UHub user (account holder)
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assignment is to employees (IT staff)
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Completion tracking
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Closing is done by employees (IT staff)
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

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

-- Step 4: Enable RLS
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access for categories" ON it_request_categories;
DROP POLICY IF EXISTS "Public read access for priorities" ON it_request_priorities;
DROP POLICY IF EXISTS "Users can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Users can create requests" ON it_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON it_requests;
DROP POLICY IF EXISTS "IT staff can view all requests" ON it_requests;
DROP POLICY IF EXISTS "IT staff can update requests" ON it_requests;
DROP POLICY IF EXISTS "Basic IT request access" ON it_requests;
DROP POLICY IF EXISTS "Employee can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Employee can create requests" ON it_requests;
DROP POLICY IF EXISTS "IT request full access" ON it_requests;
DROP POLICY IF EXISTS "Admin can view all requests" ON it_requests;

-- Step 6: Create RLS policies for user-based architecture

-- Categories and priorities - readable by all authenticated users
CREATE POLICY "Public read access for categories" ON it_request_categories
    FOR SELECT USING (true);

CREATE POLICY "Public read access for priorities" ON it_request_priorities
    FOR SELECT USING (true);

-- IT requests - User-centric policies
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON it_requests
    FOR SELECT USING (
        requester_id IN (
            SELECT u.id 
            FROM users u 
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Users can create requests for themselves
CREATE POLICY "Users can create requests" ON it_requests
    FOR INSERT WITH CHECK (
        requester_id IN (
            SELECT u.id 
            FROM users u 
            WHERE u.auth_user_id = auth.uid()
        )
    );

-- Users can update their own requests (limited fields)
CREATE POLICY "Users can update own requests" ON it_requests
    FOR UPDATE USING (
        requester_id IN (
            SELECT u.id 
            FROM users u 
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

-- IT staff can update any requests (for assignment, status changes, etc.)
CREATE POLICY "IT staff can update requests" ON it_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'it_manager', 'it_technician', 'super_admin')
        )
    );

-- Step 7: Create helper functions
CREATE OR REPLACE FUNCTION get_it_request_stats(user_id UUID DEFAULT NULL, user_role TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    request_filter TEXT := '';
BEGIN
    -- Apply user-specific filtering for non-IT roles
    IF user_role NOT IN ('admin', 'it_manager', 'it_technician', 'super_admin') AND user_id IS NOT NULL THEN
        request_filter := 'WHERE requester_id = ''' || user_id || '''';
    END IF;
    
    EXECUTE format('
        SELECT json_build_object(
            ''total_requests'', COUNT(*),
            ''open_requests'', COUNT(*) FILTER (WHERE status = ''open''),
            ''assigned_requests'', COUNT(*) FILTER (WHERE status = ''assigned''),
            ''in_progress_requests'', COUNT(*) FILTER (WHERE status = ''in_progress''),
            ''pending_approval_requests'', COUNT(*) FILTER (WHERE status = ''pending_approval''),
            ''resolved_requests'', COUNT(*) FILTER (WHERE status = ''resolved''),
            ''closed_requests'', COUNT(*) FILTER (WHERE status = ''closed''),
            ''cancelled_requests'', COUNT(*) FILTER (WHERE status = ''cancelled''),
            ''unassigned_requests'', COUNT(*) FILTER (WHERE assigned_to IS NULL AND status != ''closed''),
            ''my_requests'', COUNT(*) FILTER (WHERE requester_id = %L),
            ''assigned_to_me'', COUNT(*) FILTER (WHERE assigned_to = (
                SELECT e.id FROM employees e JOIN users u ON u.employee_id = e.id WHERE u.id = %L
            ))
        )
        FROM it_requests %s
    ', user_id, user_id, request_filter)
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create enhanced view for easier querying
CREATE OR REPLACE VIEW it_requests_with_details AS
SELECT 
    r.*,
    -- Category details
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    
    -- Priority details
    p.name as priority_name,
    p.level as priority_level,
    p.color as priority_color,
    p.sla_hours,
    
    -- Requester (User) details
    u.full_name as requester_name,
    u.email as requester_email,
    u.role as requester_role,
    u.department as requester_department,
    
    -- Employee details for assignment
    assigned_emp.full_name as assigned_to_name,
    assigned_emp.email as assigned_to_email,
    assigned_emp.department as assigned_to_department,
    
    -- Employee details for who closed the request
    closed_emp.full_name as closed_by_name,
    closed_emp.email as closed_by_email
    
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN users u ON r.requester_id = u.id
LEFT JOIN employees assigned_emp ON r.assigned_to = assigned_emp.id
LEFT JOIN employees closed_emp ON r.closed_by = closed_emp.id;

-- Step 9: Grant necessary permissions
GRANT SELECT ON it_request_categories TO authenticated;
GRANT SELECT ON it_request_priorities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON it_requests TO authenticated;
GRANT SELECT ON it_requests_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_it_request_stats(UUID, TEXT) TO authenticated;

-- Step 10: Create sample IT request for testing (optional)
DO $$
DECLARE
    sample_user_id UUID;
    sample_category_id UUID;
    sample_priority_id UUID;
BEGIN
    -- Get a sample user ID (first user found)
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Get sample category and priority IDs
    SELECT id INTO sample_category_id FROM it_request_categories WHERE name = 'Hardware' LIMIT 1;
    SELECT id INTO sample_priority_id FROM it_request_priorities WHERE name = 'Medium' LIMIT 1;
    
    -- Only create sample request if we have the required data and no requests exist
    IF sample_user_id IS NOT NULL AND sample_category_id IS NOT NULL AND sample_priority_id IS NOT NULL 
       AND (SELECT COUNT(*) FROM it_requests) = 0 THEN
        INSERT INTO it_requests (
            title, 
            description, 
            requester_id, 
            category_id, 
            priority_id,
            request_type
        ) VALUES (
            'Sample IT Request - Computer Not Working',
            'My computer is not starting up properly. It shows a blue screen when I try to boot it.',
            sample_user_id,
            sample_category_id,
            sample_priority_id,
            'it_service'
        );
        
        RAISE NOTICE 'Sample IT request created for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create sample request: %', SQLERRM;
END $$;

-- Step 11: Verification and results
SELECT 
    'IT Request System Setup Complete' as status,
    'Architecture: User-based (UHub account holders)' as architecture,
    'Categories: ' || (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    'Priorities: ' || (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    'Sample Requests: ' || (SELECT COUNT(*) FROM it_requests) as requests_count;

-- Show sample data
(SELECT 'Sample Categories' as type, name, color, icon FROM it_request_categories ORDER BY sort_order LIMIT 3)
UNION ALL
(SELECT 'Sample Priorities' as type, name, color, level::text FROM it_request_priorities ORDER BY level LIMIT 3);

-- Show current users for reference
SELECT 
    'Current Users in System' as info,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role IN ('admin', 'it_manager', 'it_technician')) as it_staff_count
FROM users;

-- Final notices
DO $$
BEGIN
    RAISE NOTICE 'IT Request System is now configured for UHub account holders (users table)';
    RAISE NOTICE 'Users can create requests, IT staff (employees) can manage them';
    RAISE NOTICE 'View available: it_requests_with_details';
    RAISE NOTICE 'Function available: get_it_request_stats(user_id, user_role)';
END $$;

-- Simple IT Request System Setup - Step by Step
-- This version ensures each step works before moving to the next

-- Step 1: Create basic tables first (without complex relationships)
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

-- Step 2: Insert sample data for categories and priorities
INSERT INTO it_request_categories (name, description, color, icon, sort_order) 
VALUES 
    ('Hardware', 'Computer, printer, and hardware issues', '#EF4444', 'monitor', 1),
    ('Software', 'Software installation and troubleshooting', '#3B82F6', 'download', 2),
    ('Network', 'Internet and network connectivity issues', '#10B981', 'wifi', 3),
    ('Access', 'Account access and permission requests', '#F59E0B', 'key', 4),
    ('Email', 'Email setup and troubleshooting', '#8B5CF6', 'mail', 5),
    ('Phone', 'Phone and communication issues', '#06B6D4', 'phone', 6),
    ('Security', 'Security and antivirus issues', '#DC2626', 'shield', 7),
    ('Other', 'Other IT-related requests', '#6B7280', 'help-circle', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert priorities safely, handling existing data
DO $$
BEGIN
    -- Only insert if the table is empty
    IF (SELECT COUNT(*) FROM it_request_priorities) = 0 THEN
        INSERT INTO it_request_priorities (name, level, description, color, sla_hours) 
        VALUES 
            ('Critical', 1, 'System down, business critical', '#DC2626', 4),
            ('High', 2, 'Significant impact on productivity', '#F59E0B', 24),
            ('Medium', 3, 'Moderate impact, standard request', '#3B82F6', 72),
            ('Low', 4, 'Minor issue, can wait', '#10B981', 168),
            ('Enhancement', 5, 'Feature request or improvement', '#8B5CF6', 336);
        RAISE NOTICE 'Sample priorities inserted';
    ELSE
        RAISE NOTICE 'Priorities already exist, skipping insert';
    END IF;
END $$;

-- Step 3: Create main IT requests table
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
    
    -- Assignment is to employees (IT staff) - make this optional for now
    assigned_to UUID,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Completion tracking
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Closing is done by employees (IT staff) - make this optional for now
    closed_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add foreign key constraints separately (if employees table exists)
DO $$
BEGIN
    -- Check if employees table exists before adding foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        -- Add foreign key constraint for assigned_to
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'it_requests_assigned_to_fkey'
        ) THEN
            ALTER TABLE it_requests 
            ADD CONSTRAINT it_requests_assigned_to_fkey 
            FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL;
        END IF;
        
        -- Add foreign key constraint for closed_by
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'it_requests_closed_by_fkey'
        ) THEN
            ALTER TABLE it_requests 
            ADD CONSTRAINT it_requests_closed_by_fkey 
            FOREIGN KEY (closed_by) REFERENCES employees(id) ON DELETE SET NULL;
        END IF;
        
        RAISE NOTICE 'Foreign key constraints added to employees table';
    ELSE
        RAISE NOTICE 'Employees table not found - skipping foreign key constraints';
    END IF;
END $$;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

-- Step 6: Enable RLS
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on it_request_categories
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'it_request_categories'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON it_request_categories';
    END LOOP;
    
    -- Drop all policies on it_request_priorities
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'it_request_priorities'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON it_request_priorities';
    END LOOP;
    
    -- Drop all policies on it_requests
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'it_requests'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON it_requests';
    END LOOP;
    
    RAISE NOTICE 'All existing RLS policies dropped';
END $$;

-- Step 8: Create simple RLS policies
-- Categories and priorities - readable by all authenticated users
CREATE POLICY "categories_select_all" ON it_request_categories
    FOR SELECT USING (true);

CREATE POLICY "priorities_select_all" ON it_request_priorities
    FOR SELECT USING (true);

-- IT requests - simplified policies
-- Everyone can read all requests (we'll refine this later)
CREATE POLICY "requests_select_all" ON it_requests
    FOR SELECT USING (true);

-- Users can insert requests
CREATE POLICY "requests_insert_users" ON it_requests
    FOR INSERT WITH CHECK (true);

-- Users can update requests
CREATE POLICY "requests_update_all" ON it_requests
    FOR UPDATE USING (true);

-- Step 9: Create a simple statistics function
CREATE OR REPLACE FUNCTION get_it_request_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'open_requests', COUNT(*) FILTER (WHERE status = 'open'),
        'assigned_requests', COUNT(*) FILTER (WHERE status = 'assigned'),
        'in_progress_requests', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'pending_approval_requests', COUNT(*) FILTER (WHERE status = 'pending_approval'),
        'resolved_requests', COUNT(*) FILTER (WHERE status = 'resolved'),
        'closed_requests', COUNT(*) FILTER (WHERE status = 'closed'),
        'cancelled_requests', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'unassigned_requests', COUNT(*) FILTER (WHERE assigned_to IS NULL AND status != 'closed'),
        'my_requests', 0,
        'assigned_to_me', 0
    )
    INTO result
    FROM it_requests;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create a basic view
DROP VIEW IF EXISTS it_requests_with_details;
CREATE VIEW it_requests_with_details AS
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
    
    -- Assigned employee details (if employees table exists)
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') 
        THEN (SELECT full_name FROM employees WHERE id = r.assigned_to)
        ELSE NULL 
    END as assigned_to_name
    
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN users u ON r.requester_id = u.id;

-- Step 11: Grant permissions
GRANT SELECT ON it_request_categories TO authenticated;
GRANT SELECT ON it_request_priorities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON it_requests TO authenticated;
GRANT SELECT ON it_requests_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_it_request_stats() TO authenticated;

-- Step 12: Verification
SELECT 
    'IT Request System Setup Complete' as status,
    'Categories: ' || (SELECT COUNT(*) FROM it_request_categories) as categories,
    'Priorities: ' || (SELECT COUNT(*) FROM it_request_priorities) as priorities,
    'Requests: ' || (SELECT COUNT(*) FROM it_requests) as requests,
    'View: it_requests_with_details created' as view_status,
    'Function: get_it_request_stats() created' as function_status;

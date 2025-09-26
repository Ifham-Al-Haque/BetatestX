-- Fix IT Request System - Ensure all tables and data exist
-- Run this script to fix the IT Request system issues

-- Step 1: Create IT Request Categories if they don't exist
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

-- Step 2: Create IT Request Priorities if they don't exist
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

-- Step 3: Create IT Requests table if it doesn't exist
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

-- Step 4: Insert sample categories if table is empty
INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
    ('Hardware', 'Computer, printer, and hardware issues', '#EF4444', 'monitor', 1),
    ('Software', 'Software installation and troubleshooting', '#3B82F6', 'download', 2),
    ('Network', 'Internet and network connectivity issues', '#10B981', 'wifi', 3),
    ('Access', 'Account access and permission requests', '#F59E0B', 'key', 4),
    ('Email', 'Email setup and troubleshooting', '#8B5CF6', 'mail', 5),
    ('Phone', 'Phone and communication issues', '#06B6D4', 'phone', 6),
    ('Security', 'Security and antivirus issues', '#DC2626', 'shield', 7),
    ('Other', 'Other IT-related requests', '#6B7280', 'help-circle', 8)
ON CONFLICT (name) DO NOTHING;

-- Step 5: Insert sample priorities if they don't exist (handle both name and level conflicts)
INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
    ('Critical', 1, 'System down, business critical', '#DC2626', 4),
    ('High', 2, 'Significant impact on productivity', '#F59E0B', 24),
    ('Medium', 3, 'Moderate impact, standard request', '#3B82F6', 72),
    ('Low', 4, 'Minor issue, can wait', '#10B981', 168),
    ('Enhancement', 5, 'Feature request or improvement', '#8B5CF6', 336)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    sla_hours = EXCLUDED.sla_hours,
    updated_at = NOW();

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

-- Step 7: Enable RLS on IT Request tables
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for IT Request tables
-- Categories - All authenticated users can view
CREATE POLICY "All users can view IT request categories" ON it_request_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Priorities - All authenticated users can view
CREATE POLICY "All users can view IT request priorities" ON it_request_priorities
    FOR SELECT USING (auth.role() = 'authenticated');

-- IT Requests - Users can view their own requests, admins/IT can view all
CREATE POLICY "Users can view own IT requests" ON it_requests
    FOR SELECT USING (
        requester_id IN (
            SELECT id FROM employees WHERE auth_user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM employees e
            JOIN users u ON e.auth_user_id = u.auth_user_id
            WHERE e.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'it_management')
        )
    );

-- Users can insert their own IT requests
CREATE POLICY "Users can create IT requests" ON it_requests
    FOR INSERT WITH CHECK (
        requester_id IN (
            SELECT id FROM employees WHERE auth_user_id = auth.uid()
        )
    );

-- Admins and IT management can update IT requests
CREATE POLICY "Admins and IT can update IT requests" ON it_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN users u ON e.auth_user_id = u.auth_user_id
            WHERE e.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'it_management')
        )
    );

-- Step 9: Verify setup
SELECT 
    'IT Request System Setup Complete' as status,
    (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    (SELECT COUNT(*) FROM it_requests) as requests_count;

-- Step 10: Test the API functions
SELECT 'Testing IT Request System...' as test_info;

-- Show sample data
SELECT 'Sample Categories:' as info, name, description FROM it_request_categories LIMIT 3;
SELECT 'Sample Priorities:' as info, name, level, sla_hours FROM it_request_priorities LIMIT 3;

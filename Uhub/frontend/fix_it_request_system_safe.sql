-- Fix IT Request System - Safe Version
-- This version safely handles existing data and avoids constraint violations

-- Step 1: Verify IT Request tables exist
SELECT 
    'Checking IT Request Tables' as step,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_name IN ('it_request_categories', 'it_request_priorities', 'it_requests')
ORDER BY table_name;

-- Step 2: Create tables only if they don't exist
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

-- Step 3: Check if categories table is empty, then insert sample data
DO $$
BEGIN
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
    ELSE
        RAISE NOTICE 'Categories already exist, skipping insert';
    END IF;
END $$;

-- Step 4: Check if priorities table is empty, then insert sample data
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM it_request_priorities) = 0 THEN
        INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
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

-- Step 5: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_it_requests_requester_id ON it_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_it_requests_status ON it_requests(status);
CREATE INDEX IF NOT EXISTS idx_it_requests_priority_id ON it_requests(priority_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_category_id ON it_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_it_requests_created_at ON it_requests(created_at);

-- Step 6: Enable RLS (only if not already enabled)
DO $$
BEGIN
    -- Enable RLS on tables if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'it_request_categories' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'it_request_priorities' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'it_requests' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 7: Create RLS policies (drop existing if they exist, then recreate)
DROP POLICY IF EXISTS "All users can view IT request categories" ON it_request_categories;
CREATE POLICY "All users can view IT request categories" ON it_request_categories
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All users can view IT request priorities" ON it_request_priorities;
CREATE POLICY "All users can view IT request priorities" ON it_request_priorities
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own IT requests" ON it_requests;
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

DROP POLICY IF EXISTS "Users can create IT requests" ON it_requests;
CREATE POLICY "Users can create IT requests" ON it_requests
    FOR INSERT WITH CHECK (
        requester_id IN (
            SELECT id FROM employees WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins and IT can update IT requests" ON it_requests;
CREATE POLICY "Admins and IT can update IT requests" ON it_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN users u ON e.auth_user_id = u.auth_user_id
            WHERE e.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'it_management')
        )
    );

-- Step 8: Final verification and status
SELECT 
    'IT Request System Status' as info,
    (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    (SELECT COUNT(*) FROM it_requests) as total_requests;

SELECT 
    'Setup Complete' as status,
    'IT Request system is ready for use' as message,
    'getAllForTech API method has been added' as api_fix;

-- Step 9: Show sample data to verify
SELECT 'Sample Categories:' as info, id, name, color FROM it_request_categories ORDER BY sort_order LIMIT 5;
SELECT 'Sample Priorities:' as info, id, name, level, sla_hours FROM it_request_priorities ORDER BY level LIMIT 5;

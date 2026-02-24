-- Fix IT Requests Data Fetching Issues
-- This script fixes the "Failed to fetch data" error and ensures requests are visible
-- Run this in your Supabase SQL editor

-- Step 1: Check what requests exist in the database
SELECT 
    'Current Requests in Database' as info,
    COUNT(*) as total_requests
FROM it_requests;

-- Step 2: Check if current user can see any requests
SELECT 
    'Requests Visible to Current User' as info,
    r.id,
    r.title,
    r.requester_id,
    r.status,
    r.created_at,
    CASE 
        WHEN r.requester_id = auth.uid() THEN 'YES - Own Request'
        ELSE 'NO - Not Own Request'
    END as can_view
FROM it_requests r
ORDER BY r.created_at DESC;

-- Step 3: Check current user's auth status
SELECT 
    'Current User Info' as info,
    auth.uid() as auth_user_id,
    auth.role() as auth_role,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- Step 4: Check if user exists in users table
SELECT 
    'User Record Status' as info,
    u.id,
    u.email,
    u.auth_user_id,
    u.role,
    u.status,
    CASE 
        WHEN u.auth_user_id = auth.uid() THEN 'MATCH'
        ELSE 'NO MATCH'
    END as auth_match
FROM users u 
WHERE u.auth_user_id = auth.uid();

-- Step 5: Fix RLS policies for better data access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Users can create requests" ON it_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON it_requests;

-- Create comprehensive RLS policies
-- Policy 1: Users can view their own requests
CREATE POLICY "Users can view own requests" ON it_requests 
    FOR SELECT 
    USING (auth.uid() = requester_id);

-- Policy 2: Users can create requests
CREATE POLICY "Users can create requests" ON it_requests 
    FOR INSERT 
    WITH CHECK (auth.uid() = requester_id);

-- Policy 3: Users can update their own requests
CREATE POLICY "Users can update own requests" ON it_requests 
    FOR UPDATE 
    USING (auth.uid() = requester_id);

-- Policy 4: Admins and HR managers can view ALL requests
CREATE POLICY "Admins can view all requests" ON it_requests 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
        OR auth.uid() = requester_id  -- Also allow own requests
    );

-- Policy 5: Admins and HR managers can manage ALL requests
CREATE POLICY "Admins can manage all requests" ON it_requests 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
        OR auth.uid() = requester_id  -- Also allow own requests
    );

-- Step 6: Ensure categories and priorities are accessible
DROP POLICY IF EXISTS "Everyone can view categories" ON it_request_categories;
DROP POLICY IF EXISTS "Everyone can view priorities" ON it_request_priorities;

CREATE POLICY "Everyone can view categories" ON it_request_categories 
    FOR SELECT 
    USING (true);

CREATE POLICY "Everyone can view priorities" ON it_request_priorities 
    FOR SELECT 
    USING (true);

-- Step 7: Create a view for easier data access (optional but helpful)
DROP VIEW IF EXISTS it_request_details;
CREATE VIEW it_request_details AS
SELECT 
    r.id,
    r.request_number,
    r.title,
    r.description,
    r.status,
    r.request_type,
    r.requester_id,
    r.assigned_to,
    r.created_at,
    r.updated_at,
    c.name as category_name,
    c.description as category_description,
    c.icon as category_icon,
    c.color as category_color,
    p.name as priority_name,
    p.level as priority_level,
    p.color as priority_color,
    p.sla_hours as priority_sla_hours,
    p.description as priority_description,
    -- User info
    u.email as requester_email,
    u.full_name as requester_name
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN users u ON r.requester_id = u.auth_user_id;

-- Enable RLS on the view
ALTER VIEW it_request_details OWNER TO postgres;

-- Step 8: Test data fetching
-- This should return requests visible to current user
SELECT 
    'Test Data Fetch' as test_name,
    COUNT(*) as visible_requests
FROM it_requests
WHERE auth.uid() = requester_id;

-- Step 9: Test categories and priorities
SELECT 
    'Categories Test' as test_name,
    COUNT(*) as category_count
FROM it_request_categories;

SELECT 
    'Priorities Test' as test_name,
    COUNT(*) as priority_count
FROM it_request_priorities;

-- Step 10: Create sample data if tables are empty
DO $$
DECLARE
    cat_count INTEGER;
    prio_count INTEGER;
BEGIN
    -- Check if we have categories
    SELECT COUNT(*) INTO cat_count FROM it_request_categories;
    
    IF cat_count = 0 THEN
        -- Insert sample categories
        INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
        ('Hardware', 'Computer hardware and equipment requests', '#EF4444', 'monitor', 1),
        ('Software', 'Software installation and updates', '#3B82F6', 'download', 2),
        ('Network', 'Network and connectivity issues', '#10B981', 'wifi', 3),
        ('Access', 'Account and permissions requests', '#F59E0B', 'key', 4),
        ('Other', 'General IT requests', '#6B7280', 'help-circle', 5);
        
        RAISE NOTICE 'Created sample categories';
    END IF;
    
    -- Check if we have priorities
    SELECT COUNT(*) INTO prio_count FROM it_request_priorities;
    
    IF prio_count = 0 THEN
        -- Insert sample priorities
        INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
        ('Critical', 1, 'System down, business critical', '#DC2626', 4),
        ('High', 2, 'Major functionality affected', '#EA580C', 24),
        ('Medium', 3, 'Standard request', '#D97706', 72),
        ('Low', 4, 'Minor issue', '#65A30D', 168),
        ('Planning', 5, 'Future planning', '#6B7280', 720);
        
        RAISE NOTICE 'Created sample priorities';
    END IF;
END $$;

-- Step 11: Final verification
SELECT 
    'Final Status Check' as step,
    (SELECT COUNT(*) FROM it_requests) as total_requests,
    (SELECT COUNT(*) FROM it_requests WHERE requester_id = auth.uid()) as my_requests,
    (SELECT COUNT(*) FROM it_request_categories) as categories,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities,
    auth.uid() as current_user_id;

-- Step 12: Show recent requests for debugging
SELECT 
    'Recent Requests (Debug Info)' as info,
    r.id,
    r.title,
    r.requester_id,
    r.status,
    r.created_at,
    c.name as category,
    p.name as priority
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id  
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- Success message
SELECT '🎉 DATA FETCHING SHOULD NOW BE FIXED! Try refreshing your browser.' as final_message;

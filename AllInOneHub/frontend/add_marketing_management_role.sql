-- Add Marketing Management Role - Database Update Script
-- This script adds the new 'marketing_management' role to existing marketing calendar systems
-- Run this after the initial marketing calendar setup

-- 1. Update existing RLS policies to include marketing_management role

-- Update marketing_event_categories policies
DROP POLICY IF EXISTS "Marketing team can view all categories" ON marketing_event_categories;
DROP POLICY IF EXISTS "Marketing team can manage categories" ON marketing_event_categories;

CREATE POLICY "Marketing team can view all categories" ON marketing_event_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can manage categories" ON marketing_event_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

-- Update marketing_calendar_events policies
DROP POLICY IF EXISTS "Marketing team can view all events" ON marketing_calendar_events;
DROP POLICY IF EXISTS "Marketing team can create events" ON marketing_calendar_events;
DROP POLICY IF EXISTS "Marketing team can update events" ON marketing_calendar_events;
DROP POLICY IF EXISTS "Marketing team can delete events" ON marketing_calendar_events;

CREATE POLICY "Marketing team can view all events" ON marketing_calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can create events" ON marketing_calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can update events" ON marketing_calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can delete events" ON marketing_calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

-- Update marketing_event_comments policies
DROP POLICY IF EXISTS "Marketing team can view all comments" ON marketing_event_comments;
DROP POLICY IF EXISTS "Marketing team can create comments" ON marketing_event_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON marketing_event_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON marketing_event_comments;

CREATE POLICY "Marketing team can view all comments" ON marketing_event_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can create comments" ON marketing_event_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Users can update their own comments" ON marketing_event_comments
    FOR UPDATE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Users can delete their own comments" ON marketing_event_comments
    FOR DELETE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- Update marketing_event_attachments policies
DROP POLICY IF EXISTS "Marketing team can view all attachments" ON marketing_event_attachments;
DROP POLICY IF EXISTS "Marketing team can manage attachments" ON marketing_event_attachments;

CREATE POLICY "Marketing team can view all attachments" ON marketing_event_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can manage attachments" ON marketing_event_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- Update marketing_event_participants policies
DROP POLICY IF EXISTS "Marketing team can view all participants" ON marketing_event_participants;
DROP POLICY IF EXISTS "Marketing team can manage participants" ON marketing_event_participants;

CREATE POLICY "Marketing team can view all participants" ON marketing_event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

CREATE POLICY "Marketing team can manage participants" ON marketing_event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- Update marketing_notifications policies if they exist
DROP POLICY IF EXISTS "Marketing team can create notifications" ON marketing_notifications;

CREATE POLICY "Marketing team can create notifications" ON marketing_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- 2. Update helper functions to include marketing_management role

-- Update is_marketing_user function
DROP FUNCTION IF EXISTS is_marketing_user(UUID);
CREATE OR REPLACE FUNCTION is_marketing_user(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_id 
        AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
    );
END;
$$;

-- Update get_marketing_team function
DROP FUNCTION IF EXISTS get_marketing_team();
CREATE OR REPLACE FUNCTION get_marketing_team()
RETURNS TABLE (
    id UUID,
    full_name VARCHAR(255),
    role VARCHAR(50),
    department VARCHAR(100),
    avatar_url TEXT,
    is_online BOOLEAN,
    last_seen TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.auth_user_id,
        up.full_name,
        up.role,
        up.department,
        up.avatar_url,
        COALESCE(us.is_online, false) as is_online,
        us.last_seen
    FROM users up
    LEFT JOIN user_status us ON up.auth_user_id = us.user_id
    WHERE up.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
    ORDER BY 
        CASE up.role 
            WHEN 'admin' THEN 1
            WHEN 'marketing_manager' THEN 2
            WHEN 'marketing_management' THEN 3
            WHEN 'marketing_specialist' THEN 4
        END,
        up.full_name;
END;
$$;

-- Update can_manage_marketing_events function
DROP FUNCTION IF EXISTS can_manage_marketing_events(UUID);
CREATE OR REPLACE FUNCTION can_manage_marketing_events(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_id 
        AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
    );
END;
$$;

-- 3. Grant permissions for updated functions
GRANT EXECUTE ON FUNCTION is_marketing_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketing_team() TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_marketing_events(UUID) TO authenticated;

-- 4. Create sample marketing management user (optional)
-- Uncomment and modify this if you want to create a test user
-- Note: You'll need to get the actual user ID from auth.users table first
/*
-- First, get user ID from auth.users table:
-- SELECT id, email FROM auth.users WHERE email = 'marketing.management@company.com';

INSERT INTO users (id, user_id, full_name, role, department, avatar_url)
VALUES (
    'actual-user-id-from-auth-users',
    'actual-user-id-from-auth-users',
    'Marketing Management',
    'marketing_management',
    'Marketing',
    null
)
ON CONFLICT (id) DO NOTHING;
*/

-- 5. Update existing users to marketing_management role (if needed)
-- Uncomment and modify these if you want to convert existing users
/*
-- Update by full_name or other criteria since email is not in users
UPDATE users 
SET role = 'marketing_management' 
WHERE full_name = 'Marketing Management User';

-- Or update by specific user ID
UPDATE users 
SET role = 'marketing_management' 
WHERE id = 'specific-user-id-here';
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Marketing Management role added successfully!';
    RAISE NOTICE 'Marketing Management role permissions:';
    RAISE NOTICE '- Full access to Marketing Panel (create, edit, delete events)';
    RAISE NOTICE '- Access to Home Panel (Home, Calendar View)';
    RAISE NOTICE '- Full access to Slice of Life Panel';
    RAISE NOTICE '- Access to Communication Panel';
    RAISE NOTICE '- Access to HR Panel (Employees, Complaints, Suggestions)';
    RAISE NOTICE '- Access to IT Services (IT Requests)';
    RAISE NOTICE '- Full access to To Do List Panel';
    RAISE NOTICE '';
    RAISE NOTICE 'To assign this role to a user, update their role in users table:';
    RAISE NOTICE 'UPDATE users SET role = ''marketing_management'' WHERE full_name = ''User Full Name'';';
    RAISE NOTICE 'Or by user ID: UPDATE users SET role = ''marketing_management'' WHERE id = ''user-id-here'';';
END $$;

-- Marketing Role Setup - Add Marketing Roles to the System
-- This script creates marketing-specific roles and updates the user system
-- Run this after creating the marketing calendar schema

-- 1. Create marketing-specific roles in users table
-- Update existing users with marketing roles (if any exist)
-- Note: Since users doesn't have email column, we'll update by role patterns
UPDATE users 
SET role = 'marketing_manager' 
WHERE role = 'marketing';

-- You can manually update specific users by their ID or full_name
-- Example: UPDATE users SET role = 'marketing_management' WHERE full_name = 'Marketing Management User';

-- 2. Create sample marketing users (optional - for testing)
-- Uncomment and modify these if you want to create test users
-- Note: You'll need to get the actual user IDs from auth.users table first
/*
-- First, get user IDs from auth.users table:
-- SELECT id, email FROM auth.users WHERE email LIKE '%marketing%';

INSERT INTO users (id, user_id, full_name, role, department, avatar_url)
VALUES 
    (
        'actual-user-id-from-auth-users',
        'actual-user-id-from-auth-users',
        'Marketing Manager',
        'marketing_manager',
        'Marketing',
        null
    ),
    (
        'actual-user-id-from-auth-users',
        'actual-user-id-from-auth-users',
        'Marketing Specialist',
        'marketing_specialist',
        'Marketing',
        null
    )
ON CONFLICT (id) DO NOTHING;
*/

-- 3. Create RPC function to check marketing role access
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

-- 4. Create function to get marketing team members
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

-- 5. Create function to check if user can manage marketing events
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

-- 6. Create function to get marketing dashboard stats
DROP FUNCTION IF EXISTS get_marketing_dashboard_stats();
CREATE OR REPLACE FUNCTION get_marketing_dashboard_stats()
RETURNS TABLE (
    total_events BIGINT,
    upcoming_events BIGINT,
    events_this_month BIGINT,
    events_this_week BIGINT,
    most_active_category VARCHAR(100),
    recent_comments BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM marketing_calendar_events) as total_events,
        (SELECT COUNT(*) FROM marketing_calendar_events WHERE event_date >= CURRENT_DATE) as upcoming_events,
        (SELECT COUNT(*) FROM marketing_calendar_events WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE)) as events_this_month,
        (SELECT COUNT(*) FROM marketing_calendar_events WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as events_this_week,
        (SELECT c.name FROM marketing_event_categories c 
         JOIN marketing_calendar_events e ON c.id = e.category_id 
         GROUP BY c.id, c.name 
         ORDER BY COUNT(*) DESC 
         LIMIT 1) as most_active_category,
        (SELECT COUNT(*) FROM marketing_event_comments WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_comments;
END;
$$;

-- 7. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION is_marketing_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketing_team() TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_marketing_events(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketing_dashboard_stats() TO authenticated;

-- 8. Create notification system for marketing events (optional)
CREATE TABLE IF NOT EXISTS marketing_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES marketing_calendar_events(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('event_created', 'event_updated', 'event_deleted', 'comment_added', 'event_reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS for notifications
ALTER TABLE marketing_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policy for notifications
CREATE POLICY "Users can view their own notifications" ON marketing_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON marketing_notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Marketing team can create notifications" ON marketing_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- 9. Create function to send marketing notifications
DROP FUNCTION IF EXISTS send_marketing_notification(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION send_marketing_notification(
    target_user_id UUID,
    event_id UUID,
    notification_type VARCHAR(50),
    notification_title VARCHAR(255),
    notification_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Only marketing team can send notifications
    IF NOT is_marketing_user(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Only marketing team can send notifications';
    END IF;
    
    INSERT INTO marketing_notifications (user_id, event_id, type, title, message)
    VALUES (target_user_id, event_id, notification_type, notification_title, notification_message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION send_marketing_notification(UUID, UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;

-- 10. Create function to get user notifications
DROP FUNCTION IF EXISTS get_user_marketing_notifications(UUID);
CREATE OR REPLACE FUNCTION get_user_marketing_notifications(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    event_id UUID,
    event_title VARCHAR(255),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.event_id,
        e.title as event_title,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.created_at
    FROM marketing_notifications n
    LEFT JOIN marketing_calendar_events e ON n.event_id = e.id
    WHERE n.user_id = get_user_marketing_notifications.user_id
    ORDER BY n.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_marketing_notifications(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Marketing Role Setup completed successfully!';
    RAISE NOTICE 'Marketing roles: marketing_manager, marketing_specialist';
    RAISE NOTICE 'Helper functions created for role checking and team management.';
    RAISE NOTICE 'Notification system enabled for marketing events.';
    RAISE NOTICE 'Remember to update the frontend role configuration.';
END $$;

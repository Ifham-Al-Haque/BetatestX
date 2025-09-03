-- Comprehensive Notification System
-- This script creates a complete notification system for the Uhub application

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_label VARCHAR(100)
);

-- 2. Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- 3. Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    email_template TEXT,
    push_template TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_type ON notification_preferences(notification_type);

-- 5. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- All authenticated users can view notification templates
CREATE POLICY "All users can view templates" ON notification_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT 'medium',
    p_action_url TEXT DEFAULT NULL,
    p_action_label VARCHAR(100) DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    template_record notification_templates%ROWTYPE;
    final_title VARCHAR(255);
    final_message TEXT;
BEGIN
    -- Get template if it exists
    SELECT * INTO template_record 
    FROM notification_templates 
    WHERE type = p_type AND is_active = TRUE;
    
    -- Use template or provided values
    IF template_record.id IS NOT NULL THEN
        final_title := template_record.title_template;
        final_message := template_record.message_template;
        
        -- Replace placeholders in templates
        final_title := replace(final_title, '{title}', p_title);
        final_message := replace(final_message, '{message}', p_message);
        
        -- Use template priority if not specified
        IF p_priority = 'medium' THEN
            p_priority := template_record.priority;
        END IF;
    ELSE
        final_title := p_title;
        final_message := p_message;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        user_id, type, title, message, data, priority, 
        action_url, action_label, expires_at
    ) VALUES (
        p_user_id, p_type, final_title, final_message, p_data, p_priority,
        p_action_url, p_action_label, p_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to create notifications for multiple users
CREATE OR REPLACE FUNCTION create_notifications_for_users(
    p_user_ids UUID[],
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT 'medium',
    p_action_url TEXT DEFAULT NULL,
    p_action_label VARCHAR(100) DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    user_id UUID;
    notification_count INTEGER := 0;
BEGIN
    FOREACH user_id IN ARRAY p_user_ids
    LOOP
        PERFORM create_notification(
            user_id, p_type, p_title, p_message, p_data, 
            p_priority, p_action_url, p_action_label, p_expires_at
        );
        notification_count := notification_count + 1;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to create notifications for users by role
CREATE OR REPLACE FUNCTION create_notifications_for_role(
    p_role VARCHAR(50),
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT 'medium',
    p_action_url TEXT DEFAULT NULL,
    p_action_label VARCHAR(100) DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    user_ids UUID[];
    notification_count INTEGER;
BEGIN
    -- Get all user IDs with the specified role
    SELECT ARRAY_AGG(id) INTO user_ids
    FROM users
    WHERE role = p_role AND status = 'active';
    
    -- Create notifications for all users with the role
    SELECT create_notifications_for_users(
        user_ids, p_type, p_title, p_message, p_data,
        p_priority, p_action_url, p_action_label, p_expires_at
    ) INTO notification_count;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user_id for this notification
    SELECT notifications.user_id INTO user_id
    FROM notifications
    WHERE id = p_notification_id;
    
    -- Check if the current user owns this notification
    IF user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Mark as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    target_user_id UUID;
    updated_count INTEGER;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Check if the current user is trying to update their own notifications
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Mark all unread notifications as read
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = target_user_id AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    target_user_id UUID;
    result JSON;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Check if the current user is trying to access their own stats
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    SELECT json_build_object(
        'total_notifications', COUNT(*),
        'unread_notifications', COUNT(*) FILTER (WHERE is_read = FALSE),
        'read_notifications', COUNT(*) FILTER (WHERE is_read = TRUE),
        'high_priority_notifications', COUNT(*) FILTER (WHERE priority = 'high' AND is_read = FALSE),
        'urgent_notifications', COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = FALSE),
        'notifications_by_type', json_object_agg(type, type_count)
    ) INTO result
    FROM (
        SELECT 
            type,
            COUNT(*) as type_count
        FROM notifications
        WHERE user_id = target_user_id AND is_read = FALSE
        GROUP BY type
    ) type_stats
    CROSS JOIN (
        SELECT COUNT(*) as total_count
        FROM notifications
        WHERE user_id = target_user_id
    ) total_stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 15. Insert default notification templates
INSERT INTO notification_templates (type, title_template, message_template, priority) VALUES
('complaint', 'New Complaint Submitted', 'A new complaint has been submitted: {title}. Please review and take appropriate action.', 'high'),
('complaint_update', 'Complaint Status Updated', 'Complaint "{title}" status has been updated to {status}.', 'medium'),
('suggestion', 'New Suggestion Submitted', 'A new suggestion has been submitted: {title}. Please review and consider implementation.', 'medium'),
('it_request', 'New IT Request Created', 'A new IT request has been created: {title}. Please review and assign if necessary.', 'high'),
('it_request_update', 'IT Request Status Updated', 'IT request "{title}" status has been updated to {status}.', 'medium'),
('chat_message', 'New Chat Message', 'You have received a new message from {sender_name}: {message}', 'low'),
('task_assigned', 'New Task Assigned', 'A new task has been assigned to you: {title}. Due date: {due_date}', 'medium'),
('task_update', 'Task Status Updated', 'Task "{title}" status has been updated to {status}.', 'medium'),
('expense_submitted', 'New Expense Submitted', 'A new expense has been submitted for approval: {title}. Amount: {amount}', 'medium'),
('expense_approved', 'Expense Approved', 'Your expense "{title}" has been approved.', 'low'),
('expense_rejected', 'Expense Rejected', 'Your expense "{title}" has been rejected. Reason: {reason}', 'medium'),
('attendance_issue', 'Attendance Issue', 'There is an issue with your attendance record for {date}. Please review and correct if necessary.', 'high'),
('payment_due', 'Payment Due', 'Payment is due for {description}. Due date: {due_date}. Amount: {amount}', 'high'),
('calendar_event', 'New Calendar Event', 'A new calendar event has been created: {title}. Date: {event_date}', 'low'),
('system_maintenance', 'System Maintenance', 'Scheduled system maintenance will occur on {date} from {start_time} to {end_time}.', 'medium'),
('security_alert', 'Security Alert', 'Security alert: {message}. Please review and take appropriate action.', 'urgent');

-- 16. Insert default notification preferences for all users
INSERT INTO notification_preferences (user_id, notification_type, email_enabled, push_enabled, in_app_enabled)
SELECT 
    u.id,
    nt.type,
    CASE 
        WHEN nt.priority IN ('urgent', 'high') THEN TRUE
        ELSE TRUE
    END,
    TRUE,
    TRUE
FROM users u
CROSS JOIN notification_templates nt
WHERE u.status = 'active'
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- 17. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT SELECT ON notification_templates TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notifications_for_users TO authenticated;
GRANT EXECUTE ON FUNCTION create_notifications_for_role TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats TO authenticated;

-- 18. Create view for notification details
CREATE VIEW notification_details AS
SELECT 
    n.*,
    u.full_name as user_name,
    u.email as user_email,
    u.role as user_role,
    u.department as user_department
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id;

GRANT SELECT ON notification_details TO authenticated;

-- 19. Create function to notify on complaint creation
CREATE OR REPLACE FUNCTION notify_complaint_created()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_ids UUID[];
    hr_manager_user_ids UUID[];
BEGIN
    -- Get admin and HR manager user IDs
    SELECT ARRAY_AGG(id) INTO admin_user_ids
    FROM users
    WHERE role = 'admin' AND status = 'active';
    
    SELECT ARRAY_AGG(id) INTO hr_manager_user_ids
    FROM users
    WHERE role = 'hr_manager' AND status = 'active';
    
    -- Create notifications for admins
    IF admin_user_ids IS NOT NULL AND array_length(admin_user_ids, 1) > 0 THEN
        PERFORM create_notifications_for_users(
            admin_user_ids,
            'complaint',
            'New Complaint Submitted',
            'A new complaint has been submitted: ' || NEW.title,
            json_build_object(
                'complaint_id', NEW.id,
                'complaint_title', NEW.title,
                'complaint_type', NEW.complaint_type,
                'priority', NEW.priority,
                'requester_id', NEW.requester_id
            ),
            CASE 
                WHEN NEW.priority = 'high' THEN 'high'
                WHEN NEW.priority = 'urgent' THEN 'urgent'
                ELSE 'medium'
            END,
            '/complaints/' || NEW.id,
            'View Complaint'
        );
    END IF;
    
    -- Create notifications for HR managers
    IF hr_manager_user_ids IS NOT NULL AND array_length(hr_manager_user_ids, 1) > 0 THEN
        PERFORM create_notifications_for_users(
            hr_manager_user_ids,
            'complaint',
            'New Complaint Submitted',
            'A new complaint has been submitted: ' || NEW.title,
            json_build_object(
                'complaint_id', NEW.id,
                'complaint_title', NEW.title,
                'complaint_type', NEW.complaint_type,
                'priority', NEW.priority,
                'requester_id', NEW.requester_id
            ),
            CASE 
                WHEN NEW.priority = 'high' THEN 'high'
                WHEN NEW.priority = 'urgent' THEN 'urgent'
                ELSE 'medium'
            END,
            '/complaints/' || NEW.id,
            'View Complaint'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Create function to notify on suggestion creation
CREATE OR REPLACE FUNCTION notify_suggestion_created()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_ids UUID[];
    suggestion_manager_user_ids UUID[];
BEGIN
    -- Get admin user IDs
    SELECT ARRAY_AGG(id) INTO admin_user_ids
    FROM users
    WHERE role = 'admin' AND status = 'active';
    
    -- Get suggestion manager user IDs (if you have this role)
    SELECT ARRAY_AGG(id) INTO suggestion_manager_user_ids
    FROM users
    WHERE role IN ('admin', 'hr_manager') AND status = 'active';
    
    -- Create notifications for admins
    IF admin_user_ids IS NOT NULL AND array_length(admin_user_ids, 1) > 0 THEN
        PERFORM create_notifications_for_users(
            admin_user_ids,
            'suggestion',
            'New Suggestion Submitted',
            'A new suggestion has been submitted: ' || NEW.title,
            json_build_object(
                'suggestion_id', NEW.id,
                'suggestion_title', NEW.title,
                'suggestion_type', NEW.suggestion_type,
                'requester_id', NEW.requester_id
            ),
            'medium',
            '/suggestions/' || NEW.id,
            'View Suggestion'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. Create function to notify on IT request creation
CREATE OR REPLACE FUNCTION notify_it_request_created()
RETURNS TRIGGER AS $$
DECLARE
    it_manager_user_ids UUID[];
    admin_user_ids UUID[];
BEGIN
    -- Get IT manager and admin user IDs
    SELECT ARRAY_AGG(id) INTO it_manager_user_ids
    FROM users
    WHERE role IN ('it_management', 'admin') AND status = 'active';
    
    SELECT ARRAY_AGG(id) INTO admin_user_ids
    FROM users
    WHERE role = 'admin' AND status = 'active';
    
    -- Create notifications for IT managers
    IF it_manager_user_ids IS NOT NULL AND array_length(it_manager_user_ids, 1) > 0 THEN
        PERFORM create_notifications_for_users(
            it_manager_user_ids,
            'it_request',
            'New IT Request Created',
            'A new IT request has been created: ' || NEW.title,
            json_build_object(
                'request_id', NEW.id,
                'request_title', NEW.title,
                'request_type', NEW.request_type,
                'priority', NEW.priority_id,
                'requester_id', NEW.requester_id
            ),
            CASE 
                WHEN (SELECT level FROM it_request_priorities WHERE id = NEW.priority_id) <= 2 THEN 'high'
                ELSE 'medium'
            END,
            '/it-requests/' || NEW.id,
            'View Request'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create triggers for automatic notifications
-- Note: These triggers will be created when the respective tables exist
-- CREATE TRIGGER trigger_notify_complaint_created
--     AFTER INSERT ON complaints
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_complaint_created();

-- CREATE TRIGGER trigger_notify_suggestion_created
--     AFTER INSERT ON suggestions
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_suggestion_created();

-- CREATE TRIGGER trigger_notify_it_request_created
--     AFTER INSERT ON it_requests
--     FOR EACH ROW
--     EXECUTE FUNCTION notify_it_request_created();

-- 23. Create scheduled job to clean up expired notifications (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-notifications', '0 2 * * *', 'SELECT cleanup_expired_notifications();');

-- 24. Create function to get user's unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    target_user_id UUID;
    unread_count INTEGER;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Check if the current user is trying to access their own count
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Get unread count
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE user_id = target_user_id 
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;

-- Complete IT Requests System Fix
-- This script creates a properly structured IT requests system

-- 1. Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS it_request_attachments CASCADE;
DROP TABLE IF EXISTS it_request_comments CASCADE;
DROP TABLE IF EXISTS it_requests CASCADE;
DROP TABLE IF EXISTS it_request_priorities CASCADE;
DROP TABLE IF EXISTS it_request_categories CASCADE;

-- 2. Create IT Request Categories table
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

-- 3. Create IT Request Priorities table
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

-- 4. Create IT Requests table
CREATE TABLE it_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number TEXT NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(50) NOT NULL DEFAULT 'it_service',
    category_id UUID NOT NULL,
    priority_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'pending_user', 'resolved', 'closed', 'cancelled')),
    requester_id UUID NOT NULL,
    assigned_to UUID,
    assigned_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_date DATE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    closed_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create IT Request Comments table
CREATE TABLE it_request_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create IT Request Attachments table
CREATE TABLE it_request_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL,
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add foreign key constraints
ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_category 
FOREIGN KEY (category_id) REFERENCES it_request_categories(id) ON DELETE RESTRICT;

ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_priority 
FOREIGN KEY (priority_id) REFERENCES it_request_priorities(id) ON DELETE RESTRICT;

ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_requester 
FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE it_requests 
ADD CONSTRAINT fk_it_requests_closed_by 
FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE it_request_comments 
ADD CONSTRAINT fk_it_request_comments_request 
FOREIGN KEY (request_id) REFERENCES it_requests(id) ON DELETE CASCADE;

ALTER TABLE it_request_comments 
ADD CONSTRAINT fk_it_request_comments_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE it_request_attachments 
ADD CONSTRAINT fk_it_request_attachments_request 
FOREIGN KEY (request_id) REFERENCES it_requests(id) ON DELETE CASCADE;

ALTER TABLE it_request_attachments 
ADD CONSTRAINT fk_it_request_attachments_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 8. Create indexes for better performance
CREATE INDEX idx_it_requests_requester ON it_requests(requester_id);
CREATE INDEX idx_it_requests_assigned_to ON it_requests(assigned_to);
CREATE INDEX idx_it_requests_status ON it_requests(status);
CREATE INDEX idx_it_requests_category ON it_requests(category_id);
CREATE INDEX idx_it_requests_priority ON it_requests(priority_id);
CREATE INDEX idx_it_requests_created_at ON it_requests(created_at);
CREATE INDEX idx_it_request_comments_request ON it_request_comments(request_id);
CREATE INDEX idx_it_request_attachments_request ON it_request_attachments(request_id);

-- 9. Create function to generate request numbers
-- Drop existing function if it exists to avoid return type conflicts
DROP FUNCTION IF EXISTS generate_request_number();

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the current date in YYYYMMDD format
    new_number := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the count of requests created today
    SELECT COUNT(*) + 1 INTO counter
    FROM it_requests
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format as YYYYMMDD-XXX
    new_number := new_number || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-generate request numbers
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

-- 11. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_it_requests_updated_at
    BEFORE UPDATE ON it_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_it_request_categories_updated_at
    BEFORE UPDATE ON it_request_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_it_request_priorities_updated_at
    BEFORE UPDATE ON it_request_priorities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_it_request_comments_updated_at
    BEFORE UPDATE ON it_request_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Insert default categories
INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
('Hardware', 'Computer hardware issues and requests', '#FF6B6B', 'monitor', 1),
('Software', 'Software installation and configuration', '#4ECDC4', 'package', 2),
('Network', 'Network connectivity and infrastructure', '#45B7D1', 'wifi', 3),
('Email', 'Email account and configuration issues', '#96CEB4', 'mail', 4),
('Access', 'User access and permissions', '#FFEAA7', 'key', 5),
('Security', 'Security-related requests and issues', '#DDA0DD', 'shield', 6),
('Other', 'Other IT-related requests', '#98D8C8', 'help-circle', 7);

-- 13. Insert default priorities
INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
('Critical', 1, 'System down, business critical', '#FF0000', 2),
('High', 2, 'Important issue affecting productivity', '#FF8C00', 8),
('Medium', 3, 'Standard priority request', '#FFD700', 24),
('Low', 4, 'Low priority, can wait', '#32CD32', 72),
('Very Low', 5, 'Lowest priority, enhancement request', '#87CEEB', 168);

-- 14. Enable Row Level Security
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;

-- 15. Create RLS policies
-- Users can see their own requests and requests assigned to them
CREATE POLICY "Users can view their own requests" ON it_requests
    FOR SELECT USING (
        requester_id = auth.uid() OR 
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'it_management', 'hr_manager')
        )
    );

-- Users can insert their own requests
CREATE POLICY "Users can create requests" ON it_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Users can update their own requests (if open) or assigned requests
CREATE POLICY "Users can update requests" ON it_requests
    FOR UPDATE USING (
        (requester_id = auth.uid() AND status = 'open') OR
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'it_management', 'hr_manager')
        )
    );

-- Users can delete their own open requests
CREATE POLICY "Users can delete their own open requests" ON it_requests
    FOR DELETE USING (
        requester_id = auth.uid() AND status = 'open'
    );

-- Comments policies
CREATE POLICY "Users can view comments for accessible requests" ON it_request_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM it_requests 
            WHERE id = request_id 
            AND (
                requester_id = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'it_management', 'hr_manager')
                )
            )
        )
    );

CREATE POLICY "Users can create comments" ON it_request_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM it_requests 
            WHERE id = request_id 
            AND (
                requester_id = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'it_management', 'hr_manager')
                )
            )
        )
    );

-- Attachments policies
CREATE POLICY "Users can view attachments for accessible requests" ON it_request_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM it_requests 
            WHERE id = request_id 
            AND (
                requester_id = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'it_management', 'hr_manager')
                )
            )
        )
    );

CREATE POLICY "Users can create attachments" ON it_request_attachments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM it_requests 
            WHERE id = request_id 
            AND (
                requester_id = auth.uid() OR 
                assigned_to = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'it_management', 'hr_manager')
                )
            )
        )
    );

-- Categories and priorities are readable by all authenticated users
CREATE POLICY "All users can view categories" ON it_request_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All users can view priorities" ON it_request_priorities
    FOR SELECT USING (auth.role() = 'authenticated');

-- 16. Create function to get request statistics
CREATE OR REPLACE FUNCTION get_it_request_stats(user_id UUID DEFAULT NULL, user_role TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'open_requests', COUNT(*) FILTER (WHERE status = 'open'),
        'assigned_requests', COUNT(*) FILTER (WHERE status = 'assigned'),
        'in_progress_requests', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'resolved_requests', COUNT(*) FILTER (WHERE status = 'resolved'),
        'closed_requests', COUNT(*) FILTER (WHERE status = 'closed'),
        'cancelled_requests', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'my_requests', COUNT(*) FILTER (WHERE requester_id = user_id),
        'assigned_to_me', COUNT(*) FILTER (WHERE assigned_to = user_id)
    ) INTO result
    FROM it_requests
    WHERE 
        (user_role IN ('admin', 'it_management', 'hr_manager')) OR
        (user_id IS NOT NULL AND (requester_id = user_id OR assigned_to = user_id));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON it_requests TO authenticated;
GRANT ALL ON it_request_categories TO authenticated;
GRANT ALL ON it_request_priorities TO authenticated;
GRANT ALL ON it_request_comments TO authenticated;
GRANT ALL ON it_request_attachments TO authenticated;
GRANT EXECUTE ON FUNCTION get_it_request_stats TO authenticated;
GRANT EXECUTE ON FUNCTION generate_request_number TO authenticated;

-- 18. Create view for request details with joins
CREATE VIEW it_request_details AS
SELECT 
    r.*,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    p.name as priority_name,
    p.level as priority_level,
    p.color as priority_color,
    p.sla_hours,
    requester.full_name as requester_name,
    requester.email as requester_email,
    requester.department as requester_department,
    assignee.full_name as assignee_name,
    assignee.email as assignee_email,
    assignee.department as assignee_department,
    closer.full_name as closer_name
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN users requester ON r.requester_id = requester.id
LEFT JOIN users assignee ON r.assigned_to = assignee.id
LEFT JOIN users closer ON r.closed_by = closer.id;

-- Grant access to the view
GRANT SELECT ON it_request_details TO authenticated;

-- 19. Create function to notify relevant users when request status changes
CREATE OR REPLACE FUNCTION notify_request_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_data JSON;
BEGIN
    -- Only notify on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        notification_data := json_build_object(
            'request_id', NEW.id,
            'request_number', NEW.request_number,
            'title', NEW.title,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'requester_id', NEW.requester_id,
            'assigned_to', NEW.assigned_to
        );
        
        -- Insert notification for requester
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            priority
        ) VALUES (
            NEW.requester_id,
            'it_request_update',
            'IT Request Status Updated',
            'Your request "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
            notification_data,
            'medium'
        );
        
        -- Insert notification for assigned user (if different from requester)
        IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.requester_id THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data,
                priority
            ) VALUES (
                NEW.assigned_to,
                'it_request_update',
                'Assigned Request Status Updated',
                'Request "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
                notification_data,
                'medium'
            );
        END IF;
        
        -- Notify IT managers and admins
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            priority
        )
        SELECT 
            u.id,
            'it_request_update',
            'IT Request Status Changed',
            'Request "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
            notification_data,
            'low'
        FROM users u
        WHERE u.role IN ('admin', 'it_management')
        AND u.id NOT IN (NEW.requester_id, COALESCE(NEW.assigned_to, '00000000-0000-0000-0000-000000000000'::UUID));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status change notifications
CREATE TRIGGER trigger_notify_request_status_change
    AFTER UPDATE ON it_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_request_status_change();

-- 20. Create function to notify when new request is created
CREATE OR REPLACE FUNCTION notify_new_request()
RETURNS TRIGGER AS $$
DECLARE
    notification_data JSON;
BEGIN
    notification_data := json_build_object(
        'request_id', NEW.id,
        'request_number', NEW.request_number,
        'title', NEW.title,
        'requester_id', NEW.requester_id,
        'category_id', NEW.category_id,
        'priority_id', NEW.priority_id
    );
    
    -- Notify IT managers and admins
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        priority
    )
    SELECT 
        u.id,
        'it_request',
        'New IT Request Created',
        'New request "' || NEW.title || '" has been submitted',
        notification_data,
        CASE 
            WHEN p.level <= 2 THEN 'high'
            WHEN p.level = 3 THEN 'medium'
            ELSE 'low'
        END
    FROM users u
    CROSS JOIN it_request_priorities p
    WHERE u.role IN ('admin', 'it_management')
    AND p.id = NEW.priority_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new request notifications
CREATE TRIGGER trigger_notify_new_request
    AFTER INSERT ON it_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_request();

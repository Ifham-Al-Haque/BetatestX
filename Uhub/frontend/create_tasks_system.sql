-- Task Management System Database Schema
-- This creates the complete task management system with real database integration

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
    department VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'bug-fix', 'feature-request', 'maintenance', 'documentation', 'training', 'meeting', 'research')),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create task comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task notifications table
CREATE TABLE IF NOT EXISTS task_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'assignment', 'status_change', 'comment', 'due_reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks assigned to them or created by them" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks they created" ON tasks;

CREATE POLICY "Users can view tasks assigned to them or created by them" ON tasks
    FOR SELECT USING (
        assigned_to = auth.uid() OR 
        assigned_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.department = tasks.department
            AND users.role NOT IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        assigned_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.status = 'active'
            AND (
                users.role IN ('admin', 'manager') OR
                users.department = tasks.department
            )
        )
    );

CREATE POLICY "Users can update tasks they created or are assigned to" ON tasks
    FOR UPDATE USING (
        assigned_to = auth.uid() OR 
        assigned_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'manager')
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.department = tasks.department
            AND users.role NOT IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can delete tasks they created" ON tasks
    FOR DELETE USING (
        assigned_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.department = tasks.department
            AND users.role = 'manager'
        )
    );

-- RLS Policies for task_comments table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;

CREATE POLICY "Users can view comments for tasks they have access to" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_comments.task_id 
            AND (
                tasks.assigned_to = auth.uid() OR 
                tasks.assigned_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY "Users can create comments for tasks they have access to" ON task_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_comments.task_id 
            AND (
                tasks.assigned_to = auth.uid() OR 
                tasks.assigned_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for task_notifications table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON task_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON task_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON task_notifications;

CREATE POLICY "Users can view their own notifications" ON task_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON task_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON task_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to send task notifications
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS send_task_notification(UUID, UUID, VARCHAR, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION send_task_notification(
    p_user_id UUID,
    p_task_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO task_notifications (user_id, task_id, type, title, message)
    VALUES (p_user_id, p_task_id, p_type, p_title, p_message);
END;
$$ LANGUAGE plpgsql;

-- Create function to get task statistics
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_task_stats(UUID);

CREATE OR REPLACE FUNCTION get_task_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_tasks BIGINT,
    my_tasks BIGINT,
    assigned_by_me BIGINT,
    pending_tasks BIGINT,
    in_progress_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE assigned_to = COALESCE(p_user_id, auth.uid())) as my_tasks,
        COUNT(*) FILTER (WHERE assigned_by = COALESCE(p_user_id, auth.uid())) as assigned_by_me,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_tasks
    FROM tasks
    WHERE 
        assigned_to = COALESCE(p_user_id, auth.uid()) OR 
        assigned_by = COALESCE(p_user_id, auth.uid()) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = COALESCE(p_user_id, auth.uid()) 
            AND users.role IN ('admin', 'manager')
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data (optional - for testing)
INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, department, category, due_date, estimated_hours, tags) VALUES
(
    'System Maintenance',
    'Perform routine system maintenance and updates',
    (SELECT auth_user_id FROM users WHERE email = 'ifham@udrive.ae' LIMIT 1),
    (SELECT auth_user_id FROM users WHERE email = 'talha@udrive.ae' LIMIT 1),
    'high',
    'in_progress',
    'IT Services',
    'maintenance',
    NOW() + INTERVAL '3 days',
    4,
    ARRAY['server', 'update']
),
(
    'Database Optimization',
    'Optimize database queries for better performance',
    (SELECT auth_user_id FROM users WHERE email = 'john@udrive.ae' LIMIT 1),
    (SELECT auth_user_id FROM users WHERE email = 'talha@udrive.ae' LIMIT 1),
    'medium',
    'pending',
    'IT Services',
    'bug-fix',
    NOW() + INTERVAL '7 days',
    8,
    ARRAY['database', 'performance']
),
(
    'Customer Support Training',
    'Conduct training session for new customer support staff',
    (SELECT auth_user_id FROM users WHERE email = 'jane@udrive.ae' LIMIT 1),
    (SELECT auth_user_id FROM users WHERE email = 'admin@udrive.ae' LIMIT 1),
    'low',
    'completed',
    'Customer Service',
    'training',
    NOW() - INTERVAL '2 days',
    2,
    ARRAY['training', 'customer-service']
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON task_comments TO authenticated;
GRANT ALL ON task_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_stats TO authenticated;
GRANT EXECUTE ON FUNCTION send_task_notification TO authenticated;

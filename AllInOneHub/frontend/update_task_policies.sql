-- Update Task Management RLS Policies
-- This script updates existing policies to include department-based access control

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks assigned to them or created by them" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks they created" ON tasks;

-- Create updated policies with department-based access control
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

-- Update task_comments policies
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
                ) OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.department = tasks.department
                    AND users.role NOT IN ('admin', 'manager')
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
                ) OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.department = tasks.department
                    AND users.role NOT IN ('admin', 'manager')
                )
            )
        )
    );

CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (user_id = auth.uid());

-- Update task_notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON task_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON task_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON task_notifications;

CREATE POLICY "Users can view their own notifications" ON task_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON task_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON task_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Update triggers for updated_at
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;

-- Create triggers for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix RLS Policies for task_comments and task_notifications
-- The issue is that policies are comparing users.id with auth.uid() which never match
-- We need to check users.auth_user_id = auth.uid() instead

-- Fix task_comments RLS policies
DROP POLICY IF EXISTS "Users can view comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments for tasks they have access to" ON task_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;

-- View comments: Check if user has access to the task
CREATE POLICY "Users can view comments for tasks they have access to" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_comments.task_id 
            AND (
                -- Check if user is assigned to or created the task (using users.id)
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = tasks.assigned_to 
                    AND users.auth_user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = tasks.assigned_by 
                    AND users.auth_user_id = auth.uid()
                ) OR
                -- Check if user is admin or manager
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'manager')
                ) OR
                -- Check if user is in same department
                EXISTS (
                    SELECT 1 FROM users u1
                    JOIN tasks t ON u1.department = t.department
                    WHERE u1.auth_user_id = auth.uid()
                    AND t.id = task_comments.task_id
                    AND u1.role NOT IN ('admin', 'manager')
                ) OR
                -- Check for coordinated tasks - user is in task_assignees
                EXISTS (
                    SELECT 1 FROM task_assignees ta
                    JOIN users u ON u.id = ta.user_id
                    WHERE ta.task_id = task_comments.task_id
                    AND u.auth_user_id = auth.uid()
                )
            )
        )
    );

-- Create comments: Check if user has access to the task AND user_id matches
CREATE POLICY "Users can create comments for tasks they have access to" ON task_comments
    FOR INSERT WITH CHECK (
        -- Check that user_id belongs to the current auth user
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = task_comments.user_id 
            AND users.auth_user_id = auth.uid()
        ) AND
        -- Check if user has access to the task
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_comments.task_id 
            AND (
                -- Check if user is assigned to or created the task
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = tasks.assigned_to 
                    AND users.auth_user_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = tasks.assigned_by 
                    AND users.auth_user_id = auth.uid()
                ) OR
                -- Check if user is admin or manager
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'manager')
                ) OR
                -- Check if user is in same department
                EXISTS (
                    SELECT 1 FROM users u1
                    JOIN tasks t ON u1.department = t.department
                    WHERE u1.auth_user_id = auth.uid()
                    AND t.id = task_comments.task_id
                    AND u1.role NOT IN ('admin', 'manager')
                ) OR
                -- Check for coordinated tasks - user is in task_assignees
                EXISTS (
                    SELECT 1 FROM task_assignees ta
                    JOIN users u ON u.id = ta.user_id
                    WHERE ta.task_id = task_comments.task_id
                    AND u.auth_user_id = auth.uid()
                )
            )
        )
    );

-- Update comments: User can only update their own comments
CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = task_comments.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Delete comments: User can only delete their own comments
CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = task_comments.user_id 
            AND users.auth_user_id = auth.uid()
        )
    );

-- Fix task_notifications RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON task_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON task_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON task_notifications;

-- View notifications: user_id in task_notifications is auth.users.id, so this should work
-- But let's make it more explicit
CREATE POLICY "Users can view their own notifications" ON task_notifications
    FOR SELECT USING (user_id = auth.uid());

-- System can create notifications (for RPC functions)
CREATE POLICY "System can create notifications" ON task_notifications
    FOR INSERT WITH CHECK (true);

-- Update notifications: user_id is auth.users.id
CREATE POLICY "Users can update their own notifications" ON task_notifications
    FOR UPDATE USING (user_id = auth.uid());


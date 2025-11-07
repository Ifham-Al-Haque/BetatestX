-- Add Multi-Assignee (Coordinated Tasks) Support
-- This script adds support for assigning tasks to multiple users

-- Step 1: Create task_assignees junction table
CREATE TABLE IF NOT EXISTS task_assignees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, user_id) -- Prevent duplicate assignments
);

-- Step 2: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);

-- Step 3: Add assignment_type column to tasks table to distinguish assignment types
-- Options: 'single' (one assignee), 'coordinated' (multiple assignees), 'self' (self-assigned)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'single' 
CHECK (assignment_type IN ('single', 'coordinated', 'self'));

-- Step 4: Enable RLS on task_assignees table
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for task_assignees
DROP POLICY IF EXISTS "Allow all authenticated users to read task assignees" ON task_assignees;
DROP POLICY IF EXISTS "Allow all authenticated users to create task assignees" ON task_assignees;
DROP POLICY IF EXISTS "Allow all authenticated users to update task assignees" ON task_assignees;
DROP POLICY IF EXISTS "Allow all authenticated users to delete task assignees" ON task_assignees;

CREATE POLICY "Allow all authenticated users to read task assignees" ON task_assignees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to create task assignees" ON task_assignees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update task assignees" ON task_assignees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete task assignees" ON task_assignees
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 6: Create a function to get all assignees for a task
-- This function joins with the users table to get user details
CREATE OR REPLACE FUNCTION get_task_assignees(p_task_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.user_id,
        COALESCE(u.email, '')::TEXT as user_email,
        COALESCE(u.full_name, u.email, 'Unknown User')::TEXT as user_name,
        ta.assigned_at
    FROM task_assignees ta
    LEFT JOIN users u ON ta.user_id = u.auth_user_id
    WHERE ta.task_id = p_task_id
    ORDER BY ta.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Migrate existing single-assignee tasks to task_assignees table
-- This ensures backward compatibility
INSERT INTO task_assignees (task_id, user_id, assigned_at)
SELECT 
    id as task_id,
    assigned_to as user_id,
    created_at as assigned_at
FROM tasks
WHERE assigned_to IS NOT NULL
  AND assignment_type = 'single'
  AND NOT EXISTS (
    SELECT 1 FROM task_assignees ta 
    WHERE ta.task_id = tasks.id AND ta.user_id = tasks.assigned_to
  );

-- Step 8: Update assignment_type for existing tasks
UPDATE tasks 
SET assignment_type = CASE
    WHEN assigned_to = assigned_by THEN 'self'
    WHEN assigned_to IS NOT NULL THEN 'single'
    ELSE 'single'
END
WHERE assignment_type IS NULL OR assignment_type = 'single';

-- Step 9: Create a view for easier querying of tasks with all assignees
-- This view joins with the users table to get user details
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            json_build_object(
                'user_id', ta.user_id,
                'user_email', COALESCE(u.email, ''),
                'user_name', COALESCE(u.full_name, u.email, 'Unknown User'),
                'assigned_at', ta.assigned_at
            )
        ) FILTER (WHERE ta.user_id IS NOT NULL),
        '[]'::json
    ) as assignees
FROM tasks t
LEFT JOIN task_assignees ta ON t.id = ta.task_id
LEFT JOIN users u ON ta.user_id = u.auth_user_id
GROUP BY t.id;

COMMENT ON TABLE task_assignees IS 'Junction table for many-to-many relationship between tasks and users (for coordinated tasks)';
COMMENT ON COLUMN tasks.assignment_type IS 'Type of assignment: single (one assignee), coordinated (multiple assignees), self (self-assigned)';


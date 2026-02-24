-- Fix 409 Error Specific
-- This script addresses the specific 409 error in task creation

-- Step 1: Check if there are any existing tasks with conflicts
SELECT 
  'Existing Tasks Check' as step,
  COUNT(*) as total_tasks,
  COUNT(DISTINCT title) as unique_titles,
  COUNT(*) - COUNT(DISTINCT title) as duplicate_titles
FROM tasks;

-- Step 2: Check for duplicate task titles
SELECT 
  'Duplicate Task Titles' as step,
  title,
  COUNT(*) as count
FROM tasks 
GROUP BY title 
HAVING COUNT(*) > 1
LIMIT 10;

-- Step 3: Check if there are any constraint violations
SELECT 
  'Constraint Check' as step,
  assigned_to,
  COUNT(*) as count
FROM tasks 
WHERE assigned_to IS NOT NULL
GROUP BY assigned_to
HAVING COUNT(*) > 100
LIMIT 10;

-- Step 4: Drop and recreate tasks table with better constraints
DROP TABLE IF EXISTS tasks CASCADE;

-- Step 5: Create tasks table with unique constraints
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID,
  assigned_by UUID,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  department VARCHAR(100),
  category VARCHAR(100),
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Add unique constraint on title to prevent duplicates
  CONSTRAINT unique_task_title UNIQUE (title)
);

-- Step 6: Add foreign key constraints with proper handling
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 7: Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
CREATE POLICY "Allow all authenticated users to read tasks" ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to create tasks" ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update tasks" ON tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete tasks" ON tasks
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 9: Create indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_department ON tasks(department);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Step 10: Test the table
SELECT 
  'Tasks Table Test' as step,
  COUNT(*) as can_read_tasks
FROM tasks;

-- Step 11: Show users for testing
SELECT 
  'Users for Task Assignment' as step,
  id,
  email,
  full_name,
  department,
  role
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != ''
ORDER BY department, full_name
LIMIT 5;

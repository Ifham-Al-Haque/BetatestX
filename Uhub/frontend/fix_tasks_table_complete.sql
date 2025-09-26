-- Fix Tasks Table Complete
-- This script ensures the tasks table is properly set up

-- Step 1: Drop existing tasks table if it has issues
DROP TABLE IF EXISTS tasks CASCADE;

-- Step 2: Create tasks table with proper structure
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
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Add foreign key constraints
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Allow all authenticated users to read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all authenticated users to create tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all authenticated users to update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all authenticated users to delete tasks" ON tasks;

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

-- Step 6: Create indexes for performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_department ON tasks(department);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Step 7: Test the table
SELECT 
  'Tasks Table Test' as step,
  COUNT(*) as can_read_tasks
FROM tasks;

-- Step 8: Show users available for testing
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

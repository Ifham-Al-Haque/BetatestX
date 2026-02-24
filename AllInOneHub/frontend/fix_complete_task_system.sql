-- Fix Complete Task System
-- This script fixes both users access and task creation issues

-- Step 1: Fix users table RLS policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view users in same department" ON users;
DROP POLICY IF EXISTS "Users can view all users for task assignment" ON users;
DROP POLICY IF EXISTS "Allow task assignment user access" ON users;

-- Create a simple, permissive policy for users
CREATE POLICY "Allow all authenticated users to read users table" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 2: Fix tasks table RLS policies
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

-- Create policies for tasks table
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

-- Step 3: Check if tasks table has proper structure
-- If tasks table doesn't exist, create it
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  priority VARCHAR DEFAULT 'medium',
  status VARCHAR DEFAULT 'pending',
  department VARCHAR,
  category VARCHAR,
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Step 4: Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Step 6: Test the fixes
SELECT 
  'Users Access Test' as step,
  COUNT(*) as can_read_users
FROM users;

SELECT 
  'Tasks Access Test' as step,
  COUNT(*) as can_read_tasks
FROM tasks;

-- Step 7: Show users available for task assignment
SELECT 
  'Users Available for Task Assignment' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != ''
ORDER BY department, full_name
LIMIT 10;

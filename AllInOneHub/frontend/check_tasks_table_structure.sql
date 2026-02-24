-- Check Tasks Table Structure and Constraints
-- This script helps identify the 409 error cause

-- Step 1: Check tasks table structure
SELECT 
  'Tasks Table Structure' as step,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Step 2: Check constraints on tasks table
SELECT 
  'Tasks Table Constraints' as step,
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'tasks'
UNION ALL
SELECT 
  'Tasks Table Constraints' as step,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tasks';

-- Step 3: Check if tasks table exists and has data
SELECT 
  'Tasks Table Data Check' as step,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
FROM tasks;

-- Step 4: Check for duplicate task titles or IDs
SELECT 
  'Duplicate Check' as step,
  title,
  COUNT(*) as count
FROM tasks 
GROUP BY title 
HAVING COUNT(*) > 1
LIMIT 10;

-- Step 5: Check recent tasks
SELECT 
  'Recent Tasks' as step,
  id,
  title,
  assigned_to,
  assigned_by,
  status,
  created_at
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 6: Check if assigned_to and assigned_by users exist
SELECT 
  'User Reference Check' as step,
  t.id,
  t.title,
  t.assigned_to,
  t.assigned_by,
  u1.full_name as assigned_to_name,
  u2.full_name as assigned_by_name
FROM tasks t
LEFT JOIN users u1 ON t.assigned_to = u1.id
LEFT JOIN users u2 ON t.assigned_by = u2.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Check if tasks are being saved in Supabase database
-- Run this in your Supabase SQL Editor

-- ============================================
-- STEP 1: Check total number of tasks
-- ============================================
SELECT 
  'Total Tasks' as check_type,
  COUNT(*) as total_tasks
FROM tasks;

-- ============================================
-- STEP 2: Get recent tasks (last 10)
-- ============================================
SELECT 
  'Recent Tasks' as check_type,
  id,
  title,
  description,
  assigned_to,
  assigned_by,
  status,
  priority,
  department,
  category,
  created_at,
  updated_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 3: Check tasks created today
-- ============================================
SELECT 
  'Tasks Created Today' as check_type,
  COUNT(*) as count,
  id,
  title,
  assigned_to,
  assigned_by,
  status,
  created_at
FROM tasks
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY id, title, assigned_to, assigned_by, status, created_at
ORDER BY created_at DESC;

-- ============================================
-- STEP 4: Verify task assignments with user details
-- ============================================
SELECT 
  'Task Assignments with User Details' as check_type,
  t.id as task_id,
  t.title,
  t.status,
  t.created_at,
  -- Assigned to user
  u_to.id as assigned_to_user_id,
  u_to.email as assigned_to_email,
  u_to.full_name as assigned_to_name,
  -- Assigned by user
  u_by.id as assigned_by_user_id,
  u_by.email as assigned_by_email,
  u_by.full_name as assigned_by_name
FROM tasks t
LEFT JOIN users u_to ON u_to.id = t.assigned_to
LEFT JOIN users u_by ON u_by.id = t.assigned_by
ORDER BY t.created_at DESC
LIMIT 10;

-- ============================================
-- STEP 5: Check for tasks with invalid user references
-- ============================================
SELECT 
  'Tasks with Invalid User References' as check_type,
  t.id as task_id,
  t.title,
  t.assigned_to,
  t.assigned_by,
  CASE 
    WHEN u_to.id IS NULL THEN '❌ assigned_to does not exist in users table'
    ELSE '✅ Valid'
  END as assigned_to_status,
  CASE 
    WHEN u_by.id IS NULL THEN '❌ assigned_by does not exist in users table'
    ELSE '✅ Valid'
  END as assigned_by_status
FROM tasks t
LEFT JOIN users u_to ON u_to.id = t.assigned_to
LEFT JOIN users u_by ON u_by.id = t.assigned_by
WHERE u_to.id IS NULL OR u_by.id IS NULL
ORDER BY t.created_at DESC;

-- ============================================
-- STEP 6: Get task statistics by status
-- ============================================
SELECT 
  'Task Statistics by Status' as check_type,
  status,
  COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY count DESC;

-- ============================================
-- STEP 7: Get task statistics by department
-- ============================================
SELECT 
  'Task Statistics by Department' as check_type,
  department,
  COUNT(*) as count
FROM tasks
WHERE department IS NOT NULL
GROUP BY department
ORDER BY count DESC;

-- ============================================
-- STEP 8: Check latest task with full details
-- ============================================
SELECT 
  'Latest Task Details' as check_type,
  t.*,
  u_to.email as assigned_to_email,
  u_to.full_name as assigned_to_name,
  u_by.email as assigned_by_email,
  u_by.full_name as assigned_by_name
FROM tasks t
LEFT JOIN users u_to ON u_to.id = t.assigned_to
LEFT JOIN users u_by ON u_by.id = t.assigned_by
ORDER BY t.created_at DESC
LIMIT 1;


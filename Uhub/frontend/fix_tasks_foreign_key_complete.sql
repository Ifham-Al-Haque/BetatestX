-- Complete Fix for Tasks Foreign Key Issue
-- Since tasks.assigned_to references users(id), we need to ensure:
-- 1. Foreign keys are correctly set up
-- 2. Any existing invalid data is cleaned up
-- 3. The constraint is properly enforced

-- ============================================
-- STEP 1: Verify Current Foreign Key Setup
-- ============================================
SELECT
    'Current Foreign Keys' as step,
    kcu.column_name, 
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tasks'
    AND (kcu.column_name = 'assigned_to' OR kcu.column_name = 'assigned_by');

-- ============================================
-- STEP 2: Check for Invalid Data
-- ============================================
-- Find tasks with assigned_to that don't exist in users table
SELECT 
  'Invalid assigned_to values' as check_type,
  t.id as task_id,
  t.title,
  t.assigned_to,
  CASE 
    WHEN u.id IS NULL THEN '❌ assigned_to does not exist in users table'
    ELSE '✅ Valid'
  END as status
FROM tasks t
LEFT JOIN users u ON u.id = t.assigned_to
WHERE t.assigned_to IS NOT NULL AND u.id IS NULL
LIMIT 10;

-- Find tasks with assigned_by that don't exist in users table
SELECT 
  'Invalid assigned_by values' as check_type,
  t.id as task_id,
  t.title,
  t.assigned_by,
  CASE 
    WHEN u.id IS NULL THEN '❌ assigned_by does not exist in users table'
    ELSE '✅ Valid'
  END as status
FROM tasks t
LEFT JOIN users u ON u.id = t.assigned_by
WHERE t.assigned_by IS NOT NULL AND u.id IS NULL
LIMIT 10;

-- ============================================
-- STEP 3: Fix Foreign Key Constraints (if needed)
-- ============================================
-- Drop existing foreign keys (if they reference wrong table)
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_assigned_to;

ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_assigned_by;

-- Add correct foreign keys referencing users.id
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- STEP 4: Clean Up Invalid Data (Optional)
-- ============================================
-- If there are tasks with invalid assigned_to, set them to NULL
-- Uncomment these if you want to clean up invalid data:
/*
UPDATE tasks 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = tasks.assigned_to);

UPDATE tasks 
SET assigned_by = NULL 
WHERE assigned_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = tasks.assigned_by);
*/

-- ============================================
-- STEP 5: Verify the Fix
-- ============================================
SELECT
    'Verification' as step,
    kcu.column_name, 
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    '✅ Foreign key correctly set up' as status
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tasks'
    AND (kcu.column_name = 'assigned_to' OR kcu.column_name = 'assigned_by')
    AND ccu.table_name = 'users'
    AND ccu.column_name = 'id';

-- ============================================
-- STEP 6: Test Query - Verify Users Available for Tasks
-- ============================================
SELECT 
  'Users Available for Task Assignment' as check_type,
  COUNT(*) as total_active_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != '' AND department != 'N/A' THEN 1 END) as users_with_department
FROM users
WHERE status = 'active';


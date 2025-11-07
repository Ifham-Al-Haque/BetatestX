-- Fix Tasks Foreign Key Issue
-- This script checks and fixes the foreign key constraint issue affecting all users

-- STEP 1: Check current foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema || '.' || ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tasks'
    AND (kcu.column_name = 'assigned_to' OR kcu.column_name = 'assigned_by');

-- STEP 2: Check if the issue is that foreign key references auth.users but should reference users
-- If tasks.assigned_to references auth.users(id), but we're using users.auth_user_id,
-- we need to either:
-- A) Change foreign key to reference users.id (if users.id is what we should use)
-- B) OR ensure all users.auth_user_id values exist in auth.users

-- STEP 3: Check sample of users to see the pattern
SELECT 
  'Sample Users Check' as check_type,
  COUNT(*) as total_users,
  COUNT(auth_user_id) as users_with_auth_id,
  COUNT(*) - COUNT(auth_user_id) as users_without_auth_id
FROM users
WHERE status = 'active';

-- STEP 4: Check if foreign key should reference users.id instead of auth.users.id
-- If the code uses users.auth_user_id but foreign key references auth.users.id,
-- we have a mismatch. The solution depends on your architecture:

-- OPTION A: If tasks should reference users.id (not auth.users.id)
-- Drop the current foreign key and create new one:
/*
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_assigned_to;

ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_assigned_by;

-- Add new foreign keys referencing users.id
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
*/

-- OPTION B: If tasks should reference auth.users.id (current setup)
-- Then we need to ensure the code uses users.auth_user_id (which it does)
-- But we also need to ensure all auth_user_id values exist in auth.users
-- Use the verify_auth_user_exists function to check:
/*
SELECT 
  email,
  auth_user_id,
  verify_auth_user_exists(auth_user_id) as exists_in_auth
FROM users
WHERE status = 'active'
LIMIT 10;
*/

-- STEP 5: RECOMMENDED FIX - Change foreign key to reference users.id
-- This is the most common pattern and matches what the code expects
-- The code uses users.auth_user_id, but if foreign key is on users.id,
-- we should use users.id instead

-- First, check what ID the code is actually sending:
-- Look at TaskManagement.jsx line 134: id: user.auth_user_id
-- So the code IS using auth_user_id, which means foreign key should be on auth.users.id
-- OR we need to change the code to use users.id

-- Let's provide both options:


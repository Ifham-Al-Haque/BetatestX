-- Comprehensive Fix for Task Assignment Issue Affecting All Users
-- This addresses the root cause: foreign key constraint mismatch

-- ============================================
-- STEP 1: DIAGNOSE THE ISSUE
-- ============================================

-- Check what the foreign key actually references
SELECT
    'Current Foreign Key Constraints' as check_type,
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
-- STEP 2: UNDERSTAND THE PROBLEM
-- ============================================
-- The code in TaskManagement.jsx uses: id: user.auth_user_id
-- This means tasks.assigned_to receives users.auth_user_id
-- 
-- If foreign key references auth.users(id):
--   ✅ This is correct IF users.auth_user_id = auth.users.id
--   ❌ This fails if users.auth_user_id doesn't exist in auth.users
--
-- If foreign key references users(id):
--   ❌ This is WRONG - code sends auth_user_id but FK expects users.id
--   ✅ Need to change code OR change foreign key

-- ============================================
-- STEP 3: CHECK SAMPLE DATA
-- ============================================
SELECT 
  'Sample User Data' as check_type,
  u.id as users_table_id,
  u.email,
  u.auth_user_id,
  u.status
FROM users u
WHERE u.status = 'active'
LIMIT 5;

-- ============================================
-- STEP 4: THE FIX - Choose the correct option
-- ============================================

-- OPTION A: Foreign key should reference auth.users(id) (current code expects this)
-- If your foreign key already references auth.users(id), then the issue is that
-- users.auth_user_id values don't exist in auth.users. You need to fix the data.

-- OPTION B: Change foreign key to reference users.id (simpler, more common)
-- This is recommended if you want tasks to reference the users table directly
-- This way, you use users.id instead of users.auth_user_id

-- RECOMMENDED FIX: Change foreign key to reference users.id
-- This matches the pattern where tasks reference users in your application

-- Drop existing foreign keys
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

-- ============================================
-- STEP 5: UPDATE THE CODE
-- ============================================
-- After changing the foreign key, you also need to update the code to use users.id
-- instead of users.auth_user_id. The code change is in TaskManagement.jsx line 182:
-- Change: id: user.auth_user_id
-- To:     id: user.id

-- ============================================
-- ALTERNATIVE: Keep foreign key on auth.users(id) and fix data
-- ============================================
-- If you want to keep the foreign key on auth.users(id), you need to ensure
-- all users.auth_user_id values exist in auth.users. This is more complex
-- and requires creating auth users for all users in your users table.

-- ============================================
-- VERIFICATION
-- ============================================
-- After applying the fix, verify:
SELECT
    'Verification' as check_type,
    kcu.column_name, 
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    ccu.column_name AS references_column
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


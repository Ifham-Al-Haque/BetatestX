-- Fix Users Access for Task Assignment
-- This script ensures the frontend can read users for task assignment

-- Step 1: Check current RLS status
SELECT 
  'Current RLS Status' as step,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- Step 2: Check existing policies
SELECT 
  'Existing RLS Policies' as step,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Step 3: Drop any restrictive policies that might be blocking access
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view users in same department" ON users;
DROP POLICY IF EXISTS "Users can view all users for task assignment" ON users;

-- Step 4: Create a permissive policy for reading users
-- This allows authenticated users to read all users for task assignment
CREATE POLICY "Allow task assignment user access" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Create a policy for updating user profiles (if needed)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Step 6: Verify the new policies
SELECT 
  'New RLS Policies' as step,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Step 7: Test the policies by trying to read users
SELECT 
  'Policy Test - Can Read Users' as step,
  COUNT(*) as can_read_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM users;

-- Step 8: Show users by department for task assignment
SELECT 
  'Users by Department for Task Assignment' as step,
  department,
  COUNT(*) as user_count,
  STRING_AGG(full_name, ', ') as users
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != ''
GROUP BY department
ORDER BY user_count DESC;

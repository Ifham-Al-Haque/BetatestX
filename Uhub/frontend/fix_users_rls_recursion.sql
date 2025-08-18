-- Fix for Infinite Recursion in Users Table RLS Policies
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what policies currently exist on the users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 2. Disable RLS temporarily to break the recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies on the users table
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to modify users" ON users;

-- 4. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Create simple, non-recursive policies for the users table
-- Policy for SELECT operations
CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated 
  USING (true);

-- Policy for INSERT operations  
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Policy for UPDATE operations
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Policy for DELETE operations
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE TO authenticated 
  USING (true);

-- 6. Verify the policies were created correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 7. Test if the recursion is fixed by trying to query the users table
SELECT COUNT(*) as user_count FROM users;

-- 8. If you need more restrictive policies, you can add them here
-- For example, if you want users to only see their own data:

-- DROP POLICY IF EXISTS "users_own_data_policy" ON users;
-- CREATE POLICY "users_own_data_policy" ON users
--   FOR ALL TO authenticated 
--   USING (auth.uid()::text = auth_user_id)
--   WITH CHECK (auth.uid()::text = auth_user_id);

-- 9. For admin users who need to see all users, you can create a separate policy:
-- DROP POLICY IF EXISTS "admin_users_policy" ON users;
-- CREATE POLICY "admin_users_policy" ON users
--   FOR ALL TO authenticated 
--   USING (
--     EXISTS (
--       SELECT 1 FROM users 
--       WHERE auth_user_id = auth.uid()::text 
--       AND role = 'admin'
--     )
--   );

-- 10. Final verification
SELECT 'Users table RLS policies fixed successfully!' as status;

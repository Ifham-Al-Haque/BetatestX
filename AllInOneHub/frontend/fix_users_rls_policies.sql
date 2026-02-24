-- Fix RLS Policies for Users Table
-- This script ensures users can be read for task assignment

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

-- Step 3: Drop existing restrictive policies (if any)
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view users in same department" ON users;

-- Step 4: Create a permissive policy for reading users
-- This allows authenticated users to read all users for task assignment
CREATE POLICY "Users can view all users for task assignment" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Create a policy for updating user profiles
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Step 6: Create a policy for inserting new users (if needed)
CREATE POLICY "Users can insert new users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 7: Verify the new policies
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

-- Step 8: Test the policies by trying to read users
SELECT 
  'Policy Test' as step,
  COUNT(*) as can_read_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM users;
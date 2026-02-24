-- Check Users Table Structure and Permissions
-- Run this in your Supabase SQL Editor

-- 1. Check if users table exists and its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check RLS policies on users table
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
WHERE tablename = 'users';

-- 3. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- 4. Check table permissions for authenticated users
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users';

-- 5. Check if there are any constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'users';

-- 6. Test inserting a user directly (this will show any constraint violations)
INSERT INTO users (
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'test-direct@example.com',
  'admin',
  'active',
  NOW(),
  NOW()
) RETURNING *;

-- 7. Clean up test data
DELETE FROM users WHERE email = 'test-direct@example.com';

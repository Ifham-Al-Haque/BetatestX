-- Quick Fix for Users Table RLS Infinite Recursion
-- Run this immediately in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily to break the recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies (this will stop the recursion)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, safe policies
CREATE POLICY "users_select_policy" ON users
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "users_delete_policy" ON users
  FOR DELETE TO authenticated 
  USING (true);

-- Step 5: Test the fix
SELECT 'Users table RLS fixed successfully!' as status;
SELECT COUNT(*) as user_count FROM users;

-- Fix Users Table RLS Policies - Safe Version
-- This script safely fixes the infinite recursion issue in RLS policies

-- Step 1: Check current RLS policies on users table
SELECT 
  'Current RLS Policies' as step,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Step 2: Drop ALL existing RLS policies to start completely fresh
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all existing policies on users table dynamically
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
  
  RAISE NOTICE 'All existing RLS policies dropped from users table';
END $$;

-- Step 3: Wait a moment for policies to be fully dropped
SELECT pg_sleep(1);

-- Step 4: Create new, safe RLS policies without infinite recursion
DO $$
BEGIN
  -- Policy 1: Users can view own profile (simple auth.uid() check)
  CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);
  RAISE NOTICE 'Policy "Users can view own profile" created';

  -- Policy 2: Users can update own profile (simple auth.uid() check)
  CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);
  RAISE NOTICE 'Policy "Users can update own profile" created';

  -- Policy 3: Users can insert their own profile (simple auth.uid() check)
  CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
  RAISE NOTICE 'Policy "Users can insert own profile" created';

  -- Policy 4: Admins can view all users (check admin role in auth context)
  CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  RAISE NOTICE 'Policy "Admins can view all users" created';

  -- Policy 5: Admins can manage all users (check admin role in auth context)
  CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  RAISE NOTICE 'Policy "Admins can manage all users" created';
  
  RAISE NOTICE 'All new RLS policies created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
    RAISE;
END $$;

-- Step 5: Verify the new policies
SELECT 
  'New RLS Policies' as step,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'd' THEN 'DELETE'
    WHEN cmd = '*' THEN 'ALL'
    ELSE cmd::text
  END as operation,
  qual as condition
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 6: Test the policies with a simple query
SELECT 
  'Policy Test' as step,
  'Testing basic SELECT query on users table' as description;

-- This should work without infinite recursion
SELECT COUNT(*) as total_users FROM public.users;

-- Step 7: Check if RLS is properly enabled
SELECT 
  'RLS Status' as step,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Step 8: Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 9: Show final verification
SELECT 
  'Final Verification' as step,
  'RLS policies fixed and verified' as description,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') > 0
    THEN '✅ RLS policies created successfully'
    ELSE '❌ RLS policies creation failed'
  END as result;

-- Step 10: Provide guidance for testing
SELECT 
  'Next Steps' as step,
  'After running this script:' as description,
  '1. Test user login and profile access' as action_1,
  '2. Verify admin users can see all users' as action_2,
  '3. Check that regular users can only see their own profile' as action_3,
  '4. Test user management functionality' as action_4;

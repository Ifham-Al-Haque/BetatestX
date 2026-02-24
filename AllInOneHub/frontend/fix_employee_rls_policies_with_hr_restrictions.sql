-- Fix Employee RLS Policies with HR Manager Restrictions
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'employees';

-- 2. Check existing policies
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
  AND tablename = 'employees';

-- 3. Drop existing policies to start fresh
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to modify employees" ON employees;
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON employees;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON employees;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON employees;

-- 4. Create role-based RLS policies for employees table

-- SELECT policy - allow all authenticated users to read (including HR Managers)
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT TO authenticated 
  USING (true);

-- INSERT policy - allow only admin, manager, and cs_manager to create
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'cs_manager')
    )
  );

-- UPDATE policy - allow only admin, manager, and cs_manager to update
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'cs_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('admin', 'manager', 'cs_manager')
    )
  );

-- DELETE policy - allow only admin and manager to delete
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('admin', 'manager')
    )
  );

-- 5. Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 6. Test the policies by checking if we can read from the table
SELECT COUNT(*) as employee_count FROM employees;

-- 7. Create a test to verify role-based access
DO $$
DECLARE
  test_id UUID;
  current_user_role TEXT;
BEGIN
  -- Get a test employee ID
  SELECT id INTO test_id FROM employees LIMIT 1;
  
  IF test_id IS NOT NULL THEN
    -- Check current user's role (this will show the role in the notice)
    SELECT role INTO current_user_role FROM users WHERE auth_user_id = auth.uid();
    
    RAISE NOTICE 'Current user role: %', COALESCE(current_user_role, 'unknown');
    
    -- Try to update a test field (this will fail for HR Managers)
    BEGIN
      UPDATE employees 
      SET updated_at = NOW() 
      WHERE id = test_id;
      
      RAISE NOTICE '✅ Update test successful for employee ID: %', test_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Update test failed: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️ No employees found to test update policy';
  END IF;
END $$;

-- 8. Show final policy status
SELECT 
  'RLS Policies Created Successfully' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'employees';

-- 9. Create a function to check user permissions
CREATE OR REPLACE FUNCTION check_employee_permissions(operation TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO user_role 
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  -- Define permissions based on role
  CASE operation
    WHEN 'read' THEN
      RETURN TRUE; -- All authenticated users can read
    WHEN 'create' THEN
      RETURN user_role IN ('admin', 'manager', 'cs_manager');
    WHEN 'update' THEN
      RETURN user_role IN ('admin', 'manager', 'cs_manager');
    WHEN 'delete' THEN
      RETURN user_role IN ('admin', 'manager');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_employee_permissions(TEXT) TO authenticated;

-- 11. Test the permission function
SELECT 
  'Permission Check Results' as test_type,
  check_employee_permissions('read') as can_read,
  check_employee_permissions('create') as can_create,
  check_employee_permissions('update') as can_update,
  check_employee_permissions('delete') as can_delete;

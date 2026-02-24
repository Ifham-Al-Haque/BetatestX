-- Fix Employee RLS Policies for Update Operations
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

-- 4. Create comprehensive RLS policies for employees table
-- SELECT policy - allow all authenticated users to read
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT TO authenticated 
  USING (true);

-- INSERT policy - allow authenticated users to create
CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- UPDATE policy - allow authenticated users to update any employee
CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- DELETE policy - allow authenticated users to delete
CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE TO authenticated 
  USING (true);

-- 5. Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 6. Test the policies by checking if we can read from the table
SELECT COUNT(*) as employee_count FROM employees;

-- 7. Create a test update to verify the policy works
-- (This will only work if you have an employee record)
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Get a test employee ID
  SELECT id INTO test_id FROM employees LIMIT 1;
  
  IF test_id IS NOT NULL THEN
    -- Try to update a test field
    UPDATE employees 
    SET updated_at = NOW() 
    WHERE id = test_id;
    
    RAISE NOTICE '✅ Update test successful for employee ID: %', test_id;
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

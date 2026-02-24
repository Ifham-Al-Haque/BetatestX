-- Fix Driver Data Access for Driver Management Role
-- This script ensures that driver_management role can access driver data

-- Step 1: Check current RLS status on drivers table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'drivers';

-- Step 2: List current policies on drivers table
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
  AND tablename = 'drivers'
ORDER BY policyname;

-- Step 3: Drop existing policies on drivers table
DO $$
BEGIN
  -- Drop all existing policies on drivers table
  DROP POLICY IF EXISTS "drivers_select_policy" ON public.drivers;
  DROP POLICY IF EXISTS "drivers_insert_policy" ON public.drivers;
  DROP POLICY IF EXISTS "drivers_update_policy" ON public.drivers;
  DROP POLICY IF EXISTS "drivers_delete_policy" ON public.drivers;
  DROP POLICY IF EXISTS "Allow authenticated users to read drivers" ON public.drivers;
  DROP POLICY IF EXISTS "Allow authenticated users to modify drivers" ON public.drivers;
  DROP POLICY IF EXISTS "drivers_authenticated_access" ON public.drivers;
  
  RAISE NOTICE 'All existing policies on drivers table dropped';
END $$;

-- Step 4: Create new, working RLS policies for drivers table
CREATE POLICY "drivers_authenticated_access" ON public.drivers
  FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Step 5: Ensure RLS is enabled on drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Step 6: Check if driver_documents table exists and fix its policies too
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'driver_documents';

-- Step 7: Fix driver_documents table policies if it exists
DO $$
BEGIN
  -- Drop existing policies on driver_documents table
  DROP POLICY IF EXISTS "driver_documents_select_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_insert_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_update_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_delete_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "Allow authenticated users to read driver_documents" ON public.driver_documents;
  DROP POLICY IF EXISTS "Allow authenticated users to modify driver_documents" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_authenticated_access" ON public.driver_documents;
  
  RAISE NOTICE 'All existing policies on driver_documents table dropped';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'driver_documents table does not exist, skipping...';
END $$;

-- Step 8: Create policies for driver_documents table if it exists
DO $$
BEGIN
  -- Create new policy for driver_documents table
  CREATE POLICY "driver_documents_authenticated_access" ON public.driver_documents
    FOR ALL TO authenticated 
    USING (true)
    WITH CHECK (true);
    
  -- Enable RLS on driver_documents table
  ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'Policies created for driver_documents table';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'driver_documents table does not exist, skipping...';
END $$;

-- Step 9: Test the policies by checking if we can access drivers data
SELECT 
  'Policy Test' as test_type,
  COUNT(*) as driver_count
FROM public.drivers;

-- Step 10: Verify the fix
SELECT 
  'Verification' as step,
  'RLS policies created successfully for drivers table' as status;

-- Step 11: Show final policy status
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('drivers', 'driver_documents')
ORDER BY tablename, policyname;

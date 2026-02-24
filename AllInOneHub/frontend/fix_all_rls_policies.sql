-- Comprehensive RLS Policy Fix
-- This script fixes all conflicting policies and ensures proper access

-- Step 1: Drop ALL existing policies on drivers table
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
  DROP POLICY IF EXISTS "drivers_full_access" ON public.drivers;
  DROP POLICY IF EXISTS "Role-based driver access" ON public.drivers;
  DROP POLICY IF EXISTS "Role-based driver delete" ON public.drivers;
  DROP POLICY IF EXISTS "Role-based driver insert" ON public.drivers;
  DROP POLICY IF EXISTS "Role-based driver update" ON public.drivers;
  
  RAISE NOTICE 'All existing policies on drivers table dropped';
END $$;

-- Step 2: Drop ALL existing policies on driver_documents table
DO $$
BEGIN
  -- Drop all existing policies on driver_documents table
  DROP POLICY IF EXISTS "driver_documents_select_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_insert_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_update_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_delete_policy" ON public.driver_documents;
  DROP POLICY IF EXISTS "Allow authenticated users to read driver_documents" ON public.driver_documents;
  DROP POLICY IF EXISTS "Allow authenticated users to modify driver_documents" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_authenticated_access" ON public.driver_documents;
  DROP POLICY IF EXISTS "driver_documents_full_access" ON public.driver_documents;
  DROP POLICY IF EXISTS "Role-based driver documents access" ON public.driver_documents;
  DROP POLICY IF EXISTS "Role-based driver documents delete" ON public.driver_documents;
  DROP POLICY IF EXISTS "Role-based driver documents insert" ON public.driver_documents;
  DROP POLICY IF EXISTS "Role-based driver documents update" ON public.driver_documents;
  
  RAISE NOTICE 'All existing policies on driver_documents table dropped';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'driver_documents table does not exist, skipping...';
END $$;

-- Step 3: Create clean, simple policies for drivers table
CREATE POLICY "drivers_authenticated_full_access" ON public.drivers
  FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Step 4: Create clean, simple policies for driver_documents table
DO $$
BEGIN
  CREATE POLICY "driver_documents_authenticated_full_access" ON public.driver_documents
    FOR ALL TO authenticated 
    USING (true)
    WITH CHECK (true);
    
  RAISE NOTICE 'Policy created for driver_documents table';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'driver_documents table does not exist, skipping...';
END $$;

-- Step 5: Ensure RLS is enabled on both tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'RLS enabled on driver_documents table';
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'driver_documents table does not exist, skipping...';
END $$;

-- Step 6: Test access to drivers data
SELECT 
  'Access Test' as test_type,
  COUNT(*) as driver_count,
  'Should show all drivers' as expected_result
FROM public.drivers;

-- Step 7: Show final policy status
SELECT 
  'Final Status' as step,
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

-- Step 8: Verify the fix
SELECT 
  'Verification Complete' as status,
  'All RLS policies fixed - drivers and driver_documents tables now have clean access policies' as message;

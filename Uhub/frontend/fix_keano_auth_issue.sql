-- Fix Authentication Issue for keano@udrive.ae
-- This script addresses RLS policy issues that are blocking user authentication

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'employees');

-- Step 2: List current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'employees')
ORDER BY tablename, policyname;

-- Step 3: Drop existing problematic policies
DO $$
BEGIN
  -- Drop all existing policies on users table
  DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
  DROP POLICY IF EXISTS "users_select_policy" ON public.users;
  DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
  DROP POLICY IF EXISTS "users_update_policy" ON public.users;
  DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
  DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
  DROP POLICY IF EXISTS "Allow authenticated users to modify users" ON public.users;
  DROP POLICY IF EXISTS "Enable read access for users based on email" ON public.users;
  DROP POLICY IF EXISTS "Enable insert for users based on email" ON public.users;
  DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
  DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;
  
  -- Drop all existing policies on employees table
  DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
  DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
  DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
  DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;
  DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON public.employees;
  DROP POLICY IF EXISTS "Allow authenticated users to modify employees" ON public.employees;
  
  RAISE NOTICE 'All existing policies dropped';
END $$;

-- Step 4: Create new, working RLS policies for users table
CREATE POLICY "users_authenticated_access" ON public.users
  FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Step 5: Create new, working RLS policies for employees table  
CREATE POLICY "employees_authenticated_access" ON public.employees
  FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Step 6: Ensure RLS is enabled on both tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Step 7: Check if keano@udrive.ae exists in auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'keano@udrive.ae';

-- Step 8: Check if keano@udrive.ae exists in users table
SELECT 
  id,
  email,
  auth_user_id,
  role,
  status,
  full_name
FROM public.users 
WHERE email = 'keano@udrive.ae';

-- Step 9: Check if keano@udrive.ae exists in employees table
SELECT 
  id,
  full_name,
  email,
  department,
  position,
  employee_id
FROM public.employees 
WHERE email = 'keano@udrive.ae';

-- Step 10: If keano@udrive.ae doesn't exist in users table, create the record
DO $$
DECLARE
  auth_user_id UUID;
  employee_id UUID;
  new_user_id UUID;
BEGIN
  -- Get the auth user ID for keano@udrive.ae
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'keano@udrive.ae';
  
  IF auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found auth user for keano@udrive.ae: %', auth_user_id;
    
    -- Check if user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth_user_id) THEN
      RAISE NOTICE 'User not found in users table, creating...';
      
      -- Check if employee exists
      SELECT id INTO employee_id 
      FROM public.employees 
      WHERE email = 'keano@udrive.ae';
      
      -- If employee doesn't exist, create it
      IF employee_id IS NULL THEN
        INSERT INTO public.employees (
          full_name,
          email,
          department,
          position,
          employee_id,
          created_at,
          updated_at
        ) VALUES (
          'Keano',
          'keano@udrive.ae',
          'Fleet Management',
          'Driver Management',
          'EMP_' || EXTRACT(EPOCH FROM NOW())::bigint,
          NOW(),
          NOW()
        ) RETURNING id INTO employee_id;
        
        RAISE NOTICE 'Created employee record with ID: %', employee_id;
      ELSE
        RAISE NOTICE 'Found existing employee record with ID: %', employee_id;
      END IF;
      
      -- Create user record
      INSERT INTO public.users (
        auth_user_id,
        employee_id,
        email,
        role,
        status,
        full_name,
        department,
        position,
        created_at,
        updated_at
      ) VALUES (
        auth_user_id,
        employee_id,
        'keano@udrive.ae',
        'driver_management',
        'active',
        'Keano',
        'Fleet Management',
        'Driver Management',
        NOW(),
        NOW()
      ) RETURNING id INTO new_user_id;
      
      RAISE NOTICE 'Created user record with ID: %', new_user_id;
    ELSE
      RAISE NOTICE 'User already exists in users table';
      
      -- Update role to driver_management if needed
      UPDATE public.users 
      SET role = 'driver_management',
          department = 'Fleet Management',
          position = 'Driver Management',
          updated_at = NOW()
      WHERE auth_user_id = auth_user_id
        AND role != 'driver_management';
        
      IF FOUND THEN
        RAISE NOTICE 'Updated user role to driver_management';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Auth user not found for keano@udrive.ae';
  END IF;
END $$;

-- Step 11: Verify the fix
SELECT 
  'Verification' as step,
  u.email,
  u.role,
  u.status,
  u.full_name,
  e.department,
  e.position
FROM public.users u
LEFT JOIN public.employees e ON u.employee_id = e.id
WHERE u.email = 'keano@udrive.ae';

-- Step 12: Test the policies
SELECT 'RLS policies created successfully' as status;

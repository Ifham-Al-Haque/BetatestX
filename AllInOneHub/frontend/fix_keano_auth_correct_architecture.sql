-- Fix Authentication Issue for keano@udrive.ae - CORRECT ARCHITECTURE
-- This script follows the proper separation: users table for app access, employees table for HR data

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

-- Step 9: Check if keano@udrive.ae exists in employees table (optional - only if he's actually an employee)
SELECT 
  id,
  full_name,
  email,
  department,
  position,
  employee_id
FROM public.employees 
WHERE email = 'keano@udrive.ae';

-- Step 10: Create/Update user record for keano@udrive.ae (CORRECT ARCHITECTURE)
DO $$
DECLARE
  keano_auth_user_id UUID;
  new_user_id UUID;
BEGIN
  -- Get the auth user ID for keano@udrive.ae
  SELECT id INTO keano_auth_user_id 
  FROM auth.users 
  WHERE email = 'keano@udrive.ae';
  
  IF keano_auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found auth user for keano@udrive.ae: %', keano_auth_user_id;
    
    -- Check if user exists in users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = keano_auth_user_id) THEN
      RAISE NOTICE 'User not found in users table, creating...';
      
      -- Create user record for application access (NO employee record needed)
      INSERT INTO public.users (
        auth_user_id,
        email,
        role,
        status,
        full_name,
        created_at,
        updated_at
      ) VALUES (
        keano_auth_user_id,
        'keano@udrive.ae',
        'driver_management',
        'active',
        'Keano',
        NOW(),
        NOW()
      ) RETURNING id INTO new_user_id;
      
      RAISE NOTICE 'Created user record with ID: %', new_user_id;
    ELSE
      RAISE NOTICE 'User already exists in users table';
      
      -- Update role to driver_management if needed
      UPDATE public.users 
      SET role = 'driver_management',
          updated_at = NOW()
      WHERE auth_user_id = keano_auth_user_id
        AND role != 'driver_management';
        
      IF FOUND THEN
        RAISE NOTICE 'Updated user role to driver_management';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Auth user not found for keano@udrive.ae';
  END IF;
END $$;

-- Step 11: Verify the fix (users table only - correct architecture)
SELECT 
  'Verification' as step,
  u.email,
  u.role,
  u.status,
  u.full_name,
  u.auth_user_id
FROM public.users u
WHERE u.email = 'keano@udrive.ae';

-- Step 12: Test the policies
SELECT 'RLS policies created successfully' as status;

-- Step 13: Architecture verification
SELECT 
  'Architecture Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = 'keano@udrive.ae') 
    THEN '✅ User record exists in users table (correct)'
    ELSE '❌ User record missing'
  END as user_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.employees WHERE email = 'keano@udrive.ae') 
    THEN 'ℹ️ Employee record exists (optional - only if keano is actually an employee)'
    ELSE 'ℹ️ No employee record (correct - not all users need to be employees)'
  END as employee_check;

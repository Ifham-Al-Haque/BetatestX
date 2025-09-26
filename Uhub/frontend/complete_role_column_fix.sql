-- Complete Role Column Fix for Employee Records
-- This script provides both immediate fix and proper architectural solution

-- ==============================================
-- PART 1: IMMEDIATE FIX - Add role column back to employees table
-- ==============================================

-- Step 1: Check current state
SELECT 
    'Current Employees Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- Step 2: Add role column to employees table if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE employees ADD COLUMN role VARCHAR(50) DEFAULT 'employee';
        RAISE NOTICE '✅ Role column added to employees table with default value "employee"';
    ELSE
        RAISE NOTICE '✅ Role column already exists in employees table';
    END IF;
END $$;

-- Step 3: Add proper constraints for role column
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
    CHECK (role IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer', 'operation_manager', 'subscribe_now'));

-- Step 4: Update existing records with NULL role values
UPDATE employees 
SET role = 'employee' 
WHERE role IS NULL;

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);

-- ==============================================
-- PART 2: VERIFY USERS TABLE EXISTS AND HAS ROLE COLUMN
-- ==============================================

-- Step 6: Check if users table exists
SELECT 
    'Users Table Check' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Step 7: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer', 'operation_manager', 'subscribe_now')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for users table (if they don't exist)
DO $$
BEGIN
    -- Policy 1: Users can view own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.users
          FOR SELECT USING (auth.uid() = auth_user_id);
        RAISE NOTICE 'Policy "Users can view own profile" created';
    END IF;

    -- Policy 2: Users can update own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth.uid() = auth_user_id);
        RAISE NOTICE 'Policy "Users can update own profile" created';
    END IF;

    -- Policy 3: Admins can view all users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public' 
        AND policyname = 'Admins can view all users'
    ) THEN
        CREATE POLICY "Admins can view all users" ON public.users
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE auth_user_id = auth.uid() AND role = 'admin'
            )
          );
        RAISE NOTICE 'Policy "Admins can view all users" created';
    END IF;

    -- Policy 4: Admins can manage all users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'public' 
        AND policyname = 'Admins can manage all users'
    ) THEN
        CREATE POLICY "Admins can manage all users" ON public.users
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.users 
              WHERE auth_user_id = auth.uid() AND role = 'admin'
            )
          );
        RAISE NOTICE 'Policy "Admins can manage all users" created';
    END IF;
END $$;

-- Step 10: Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ==============================================
-- PART 3: VERIFICATION AND TESTING
-- ==============================================

-- Step 11: Verify employees table has role column
SELECT 
    'Final Employees Table Verification' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'role';

-- Step 12: Verify users table has role column
SELECT 
    'Users Table Role Column Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'role';

-- Step 13: Test queries to ensure both tables work
SELECT 
    'Employees Table Test' as test_name,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN role = 'employee' THEN 1 END) as employee_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_count
FROM employees;

SELECT 
    'Users Table Test' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'employee' THEN 1 END) as employee_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as null_role_count
FROM public.users;

-- Step 14: Show final status
SELECT 
    'FINAL STATUS' as status,
    'Both employees and users tables now have role columns' as message,
    'Your application should now work without the role column error' as result;

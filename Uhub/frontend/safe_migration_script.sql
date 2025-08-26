-- Safe Migration Script: Separate Users and Employees
-- This script checks for existing objects before creating them

-- Step 1: Check current state
SELECT 
  'Current State Analysis' as step,
  COUNT(*) as total_records,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as with_auth,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as without_auth
FROM employees;

-- Step 2: Check if users table exists
SELECT 
  'Table Check' as step,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
    THEN '✅ Users table already exists'
    ELSE '❌ Users table does not exist'
  END as users_table_status;

-- Step 3: Create users table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE TABLE public.users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr_manager', 'cs_manager', 'driver_management', 'employee', 'viewer')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
      full_name TEXT,
      avatar_url TEXT,
      preferences JSONB DEFAULT '{}',
      last_login TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Users table created successfully';
  ELSE
    RAISE NOTICE 'Users table already exists, skipping creation';
  END IF;
END $$;

-- Step 4: Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on users table';
  ELSE
    RAISE NOTICE 'RLS already enabled on users table';
  END IF;
END $$;

-- Step 5: Create RLS policies only if they don't exist
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
  ELSE
    RAISE NOTICE 'Policy "Users can view own profile" already exists';
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
  ELSE
    RAISE NOTICE 'Policy "Users can update own profile" already exists';
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
  ELSE
    RAISE NOTICE 'Policy "Admins can view all users" already exists';
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
  ELSE
    RAISE NOTICE 'Policy "Admins can manage all users" already exists';
  END IF;
END $$;

-- Step 6: Create indexes only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON public.users(email);
    RAISE NOTICE 'Index idx_users_email created';
  ELSE
    RAISE NOTICE 'Index idx_users_email already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_auth_user_id') THEN
    CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
    RAISE NOTICE 'Index idx_users_auth_user_id created';
  ELSE
    RAISE NOTICE 'Index idx_users_auth_user_id already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
    CREATE INDEX idx_users_role ON public.users(role);
    RAISE NOTICE 'Index idx_users_role created';
  ELSE
    RAISE NOTICE 'Index idx_users_role already exists';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_status') THEN
    CREATE INDEX idx_users_status ON public.users(status);
    RAISE NOTICE 'Index idx_users_status created';
  ELSE
    RAISE NOTICE 'Index idx_users_status already exists';
  END IF;
END $$;

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_users_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION update_users_updated_at();
    RAISE NOTICE 'Trigger trigger_update_users_updated_at created';
  ELSE
    RAISE NOTICE 'Trigger trigger_update_users_updated_at already exists';
  END IF;
END $$;

-- Step 9: Grant permissions
GRANT ALL ON public.users TO authenticated;

-- Step 10: Check current users table status
SELECT 
  'Users Table Status' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM public.users;

-- Step 11: Migrate existing data (only if not already migrated)
INSERT INTO public.users (email, auth_user_id, role, status, full_name, created_at, updated_at)
SELECT 
  e.email,
  e.auth_user_id,
  e.role,
  e.status,
  e.full_name,
  e.created_at,
  e.updated_at
FROM employees e
WHERE e.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.email = e.email
  );

-- Step 12: Show migration results
SELECT 
  'Migration Results' as step,
  COUNT(*) as total_users_after_migration,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM public.users;

-- Step 13: Create backup of employees table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'employees_backup' 
    AND table_schema = 'public'
  ) THEN
    CREATE TABLE employees_backup AS SELECT * FROM employees;
    RAISE NOTICE 'Employees backup table created';
  ELSE
    RAISE NOTICE 'Employees backup table already exists';
  END IF;
END $$;

-- Step 14: Remove auth-related columns from employees (only if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE employees DROP COLUMN auth_user_id;
    RAISE NOTICE 'Column auth_user_id removed from employees table';
  ELSE
    RAISE NOTICE 'Column auth_user_id already removed from employees table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE employees DROP COLUMN role;
    RAISE NOTICE 'Column role removed from employees table';
  ELSE
    RAISE NOTICE 'Column role already removed from employees table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE employees DROP COLUMN status;
    RAISE NOTICE 'Column status removed from employees table';
  ELSE
    RAISE NOTICE 'Column status already removed from employees table';
  END IF;
END $$;

-- Step 15: Add HR-specific columns to employees (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN employee_id TEXT UNIQUE;
    RAISE NOTICE 'Column employee_id added to employees table';
  ELSE
    RAISE NOTICE 'Column employee_id already exists in employees table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'hire_date'
  ) THEN
    ALTER TABLE employees ADD COLUMN hire_date DATE;
    RAISE NOTICE 'Column hire_date added to employees table';
  ELSE
    RAISE NOTICE 'Column hire_date already exists in employees table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'salary'
  ) THEN
    ALTER TABLE employees ADD COLUMN salary DECIMAL(10,2);
    RAISE NOTICE 'Column salary added to employees table';
  ELSE
    RAISE NOTICE 'Column salary already exists in employees table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN manager_id UUID;
    RAISE NOTICE 'Column manager_id added to employees table';
  ELSE
    RAISE NOTICE 'Column manager_id already exists in employees table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'hr_data'
  ) THEN
    ALTER TABLE employees ADD COLUMN hr_data JSONB DEFAULT '{}';
    RAISE NOTICE 'Column hr_data added to employees table';
  ELSE
    RAISE NOTICE 'Column hr_data already exists in employees table';
  END IF;
END $$;

-- Step 16: Update employee_id if needed
UPDATE employees 
SET employee_id = COALESCE(employee_id, 'EMP-' || LPAD(id::text, 6, '0'))
WHERE employee_id IS NULL;

-- Step 17: Create relationship view
CREATE OR REPLACE VIEW user_employee_relationship AS
SELECT 
  u.id as user_id,
  u.email as user_email,
  u.role as user_role,
  u.status as user_status,
  u.full_name as user_full_name,
  e.id as employee_id,
  e.employee_id as company_employee_id,
  e.full_name as employee_full_name,
  e.department,
  e.position,
  e.hire_date,
  CASE 
    WHEN u.email = e.email THEN 'Same Email'
    ELSE 'Different Email'
  END as email_match,
  CASE 
    WHEN u.auth_user_id IS NOT NULL THEN 'Has Auth Account'
    ELSE 'No Auth Account'
  END as auth_status
FROM public.users u
FULL OUTER JOIN employees e ON u.email = e.email
ORDER BY u.created_at DESC, e.created_at DESC;

-- Step 18: Grant access to view
GRANT SELECT ON user_employee_relationship TO authenticated;

-- Step 19: Show final state
SELECT 
  'Final State' as step,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM user_employee_relationship WHERE email_match = 'Same Email') as linked_records,
  (SELECT COUNT(*) FROM user_employee_relationship WHERE email_match = 'Different Email') as unlinked_records;

-- Step 20: Final verification
SELECT 
  'Final Verification' as step,
  'Architecture separation complete' as description,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users) > 0 
      AND (SELECT COUNT(*) FROM employees) > 0 
      AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'auth_user_id') = 0
    THEN '✅ SUCCESS - Architecture properly separated'
    ELSE '❌ FAILED - Architecture separation incomplete'
  END as result;

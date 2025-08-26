-- Clean Migration Script: Separate Users and Employees
-- Run this step by step in your Supabase SQL editor

-- Step 1: Check current state
SELECT 
  'Current State Analysis' as step,
  COUNT(*) as total_records,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as with_auth,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as without_auth
FROM employees;

-- Step 2: Create users table
CREATE TABLE IF NOT EXISTS public.users (
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

-- Step 3: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies (one by one to avoid errors)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Step 6: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Step 8: Grant permissions
GRANT ALL ON public.users TO authenticated;

-- Step 9: Migrate existing data
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

-- Step 10: Show migration results
SELECT 
  'Migration Results' as step,
  COUNT(*) as total_users_created,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM public.users;

-- Step 11: Create backup of employees table
CREATE TABLE employees_backup AS SELECT * FROM employees;

-- Step 12: Remove auth-related columns from employees
ALTER TABLE employees DROP COLUMN IF EXISTS auth_user_id;
ALTER TABLE employees DROP COLUMN IF EXISTS role;
ALTER TABLE employees DROP COLUMN IF EXISTS status;

-- Step 13: Add HR-specific columns to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hr_data JSONB DEFAULT '{}';

-- Step 14: Update employee_id
UPDATE employees 
SET employee_id = COALESCE(employee_id, 'EMP-' || LPAD(id::text, 6, '0'))
WHERE employee_id IS NULL;

-- Step 15: Create relationship view
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

-- Step 16: Grant access to view
GRANT SELECT ON user_employee_relationship TO authenticated;

-- Step 17: Show final state
SELECT 
  'Final State' as step,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM user_employee_relationship WHERE email_match = 'Same Email') as linked_records,
  (SELECT COUNT(*) FROM user_employee_relationship WHERE email_match = 'Different Email') as unlinked_records;

-- Step 18: Verification
SELECT 
  'Verification' as step,
  'Architecture separation complete' as description,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users) > 0 
      AND (SELECT COUNT(*) FROM employees) > 0 
      AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'auth_user_id') = 0
    THEN '✅ SUCCESS - Architecture properly separated'
    ELSE '❌ FAILED - Architecture separation incomplete'
  END as result;

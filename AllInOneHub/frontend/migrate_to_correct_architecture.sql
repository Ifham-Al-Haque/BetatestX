-- Migration Script: Separate Users and Employees
-- This script helps migrate from the incorrect mixed architecture to the correct separate architecture

-- Step 1: Check current state
SELECT 
  'Current State Analysis' as step,
  COUNT(*) as total_records,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as with_auth,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as without_auth
FROM employees;

-- Step 2: Create users table if it doesn't exist
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

-- Step 3: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for users table
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

-- Step 5: Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Step 6: Migrate existing data - Create user records for employees with auth accounts
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

-- Step 7: Show migration results
SELECT 
  'Migration Results' as step,
  COUNT(*) as total_users_created,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM public.users;

-- Step 8: Clean up employees table - Remove auth-related fields that don't belong there
-- First, create a backup of the current employees table
CREATE TABLE employees_backup AS SELECT * FROM employees;

-- Step 9: Remove auth-related columns from employees table (these belong in users table)
ALTER TABLE employees DROP COLUMN IF EXISTS auth_user_id;
ALTER TABLE employees DROP COLUMN IF EXISTS role;
ALTER TABLE employees DROP COLUMN IF EXISTS status;

-- Step 10: Add proper HR-specific columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hr_data JSONB DEFAULT '{}';

-- Step 11: Update employee_id to be unique if not already
UPDATE employees 
SET employee_id = COALESCE(employee_id, 'EMP-' || LPAD(id::text, 6, '0'))
WHERE employee_id IS NULL;

-- Step 12: Create a view to show the relationship between users and employees
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

-- Step 13: Grant access to the view
GRANT SELECT ON user_employee_relationship TO authenticated;

-- Step 14: Show final state
SELECT 
  'Final State' as step,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM employees) as total_employees,
  (SELECT COUNT(*) FROM user_employee_relationship WHERE email_match = 'Same Email') as linked_records,
  (SELECT COUNT(*) FROM user_employee_relationship WHERE email_match = 'Different Email') as unlinked_records;

-- Step 15: Create summary report
SELECT 
  'Summary Report' as report_type,
  'Users Table' as table_name,
  COUNT(*) as record_count,
  STRING_AGG(DISTINCT role, ', ') as roles_present
FROM public.users
GROUP BY 'Users Table'

UNION ALL

SELECT 
  'Summary Report' as report_type,
  'Employees Table' as table_name,
  COUNT(*) as record_count,
  STRING_AGG(DISTINCT department, ', ') as departments_present
FROM employees
GROUP BY 'Employees Table';

-- Step 16: Verification queries
-- Check for any remaining auth-related data in employees table
SELECT 
  'Verification' as step,
  'Employees table should not contain auth data' as check_description,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASSED - No auth data in employees table'
    ELSE '❌ FAILED - Auth data still exists in employees table'
  END as result
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('auth_user_id', 'role', 'status');

-- Check that users table has proper structure
SELECT 
  'Verification' as step,
  'Users table has proper structure' as check_description,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASSED - Users table has proper structure'
    ELSE '❌ FAILED - Users table missing required columns'
  END as result
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('id', 'email', 'auth_user_id', 'role', 'status');

-- Step 17: Optional - Create linking table for convenience (not required)
CREATE TABLE IF NOT EXISTS user_employee_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  link_type TEXT DEFAULT 'manual' CHECK (link_type IN ('manual', 'automatic', 'verified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  notes TEXT,
  UNIQUE(user_id, employee_id)
);

-- Step 18: Insert existing links based on email matches
INSERT INTO user_employee_links (user_id, employee_id, link_type, created_at)
SELECT 
  u.id,
  e.id,
  'automatic' as link_type,
  NOW() as created_at
FROM public.users u
JOIN employees e ON u.email = e.email
WHERE NOT EXISTS (
  SELECT 1 FROM user_employee_links uel 
  WHERE uel.user_id = u.id AND uel.employee_id = e.id
);

-- Step 19: Final verification
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

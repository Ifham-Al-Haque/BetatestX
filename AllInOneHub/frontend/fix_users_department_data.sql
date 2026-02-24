-- Fix Users Table Department Data
-- This script ensures the users table has proper department data for task assignment

-- Step 1: Check current users table structure
SELECT 
  'Current Users Table Structure' as step,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('department', 'position', 'role', 'status', 'full_name', 'email')
ORDER BY column_name;

-- Step 2: Check current user data
SELECT 
  'Current User Data Analysis' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != 'Unassigned' AND department != 'N/A' AND department != '' THEN 1 END) as users_with_departments,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN status = 'active' AND department IS NOT NULL AND department != 'Unassigned' AND department != 'N/A' AND department != '' THEN 1 END) as active_users_with_departments
FROM users;

-- Step 3: Show current department distribution
SELECT 
  'Current Department Distribution' as step,
  department,
  COUNT(*) as user_count,
  STRING_AGG(COALESCE(full_name, email), ', ') as users
FROM users 
WHERE status = 'active' 
GROUP BY department
ORDER BY user_count DESC;

-- Step 4: Update existing users with proper department values
-- This maps users to departments based on their roles or other criteria
UPDATE users 
SET 
  department = CASE 
    WHEN role = 'admin' THEN 'MANAGEMENT'
    WHEN role = 'hr_manager' THEN 'HR'
    WHEN role = 'cs_manager' THEN 'CUSTOMER_SERVICE'
    WHEN role = 'driver_management' THEN 'OPERATIONS'
    WHEN role = 'it_management' THEN 'TECHNOLOGY'
    WHEN role = 'finance' THEN 'FINANCE'
    WHEN role = 'marketing_manager' OR role = 'marketing_specialist' OR role = 'marketing_management' THEN 'MARKETING'
    WHEN role = 'subscribe_now' THEN 'SUBSCRIBE_NOW_SALES'
    WHEN role = 'employee' THEN 'TECHNOLOGY' -- Default employees to TECHNOLOGY
    WHEN role = 'viewer' THEN 'OTHERS'
    ELSE 'TECHNOLOGY' -- Default to TECHNOLOGY instead of 'Unassigned'
  END,
  position = CASE 
    WHEN role = 'admin' THEN 'Administrator'
    WHEN role = 'hr_manager' THEN 'HR Manager'
    WHEN role = 'cs_manager' THEN 'Customer Service Manager'
    WHEN role = 'driver_management' THEN 'Driver Manager'
    WHEN role = 'it_management' THEN 'IT Manager'
    WHEN role = 'finance' THEN 'Finance Manager'
    WHEN role = 'marketing_manager' THEN 'Marketing Manager'
    WHEN role = 'marketing_specialist' THEN 'Marketing Specialist'
    WHEN role = 'marketing_management' THEN 'Marketing Management'
    WHEN role = 'subscribe_now' THEN 'Subscribe Now Representative'
    WHEN role = 'employee' THEN 'Employee'
    WHEN role = 'viewer' THEN 'Viewer'
    ELSE 'Employee'
  END,
  status = COALESCE(status, 'active'),
  full_name = COALESCE(full_name, email),
  updated_at = NOW()
WHERE 
  department IS NULL 
  OR department = 'Unassigned' 
  OR department = 'N/A'
  OR department = ''
  OR position IS NULL
  OR position = 'N/A'
  OR position = '';

-- Step 5: Verify the updates
SELECT 
  'Users Department Update Summary' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != 'Unassigned' AND department != 'N/A' AND department != '' THEN 1 END) as users_with_departments,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN status = 'active' AND department IS NOT NULL AND department != 'Unassigned' AND department != 'N/A' AND department != '' THEN 1 END) as active_users_with_departments
FROM users;

-- Step 6: Show updated department distribution
SELECT 
  'Updated Department Distribution' as step,
  department,
  COUNT(*) as user_count,
  STRING_AGG(COALESCE(full_name, email), ', ') as users
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != 'Unassigned' 
  AND department != 'N/A' 
  AND department != ''
GROUP BY department
ORDER BY user_count DESC;

-- Step 7: Show users that still need department assignment
SELECT 
  'Users Still Needing Department Assignment' as step,
  id,
  email,
  full_name,
  role,
  department,
  status
FROM users 
WHERE 
  department IS NULL 
  OR department = 'Unassigned' 
  OR department = 'N/A'
  OR department = ''
ORDER BY created_at DESC;

-- Step 8: Final verification - show all active users with departments
SELECT 
  'Final Verification - All Active Users with Departments' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != 'Unassigned' 
  AND department != 'N/A' 
  AND department != ''
ORDER BY department, full_name;

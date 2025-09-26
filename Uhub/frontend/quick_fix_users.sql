-- Quick fix script to populate users table with sample data
-- Run this if the users table is empty or has no valid data

-- Step 1: Check current state
SELECT 
  'Current State' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM users;

-- Step 2: Insert sample users if table is empty or has no active users
INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@uhub.com',
  'admin',
  'active',
  'Admin User',
  'MANAGEMENT',
  'Administrator',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@uhub.com');

INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'talha@uhub.com',
  'employee',
  'active',
  'Talha',
  'TECHNOLOGY',
  'Developer',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'talha@uhub.com');

INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'ifham@uhub.com',
  'employee',
  'active',
  'Ifham',
  'OPERATIONS',
  'Operations Manager',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ifham@uhub.com');

INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'hr@uhub.com',
  'hr_manager',
  'active',
  'HR Manager',
  'HR',
  'HR Manager',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'hr@uhub.com');

INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'finance@uhub.com',
  'finance',
  'active',
  'Finance Manager',
  'FINANCE',
  'Finance Manager',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'finance@uhub.com');

INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'marketing@uhub.com',
  'marketing_manager',
  'active',
  'Marketing Manager',
  'MARKETING',
  'Marketing Manager',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'marketing@uhub.com');

INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'cs@uhub.com',
  'cs_manager',
  'active',
  'Customer Service Manager',
  'CUSTOMER_SERVICE',
  'Customer Service Manager',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'cs@uhub.com');

-- Step 3: Verify the insertions
SELECT 
  'After Insertion' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != '' THEN 1 END) as users_with_departments
FROM users;

-- Step 4: Show all users
SELECT 
  'All Users' as step,
  id,
  email,
  full_name,
  role,
  department,
  position,
  status
FROM users 
ORDER BY created_at DESC;

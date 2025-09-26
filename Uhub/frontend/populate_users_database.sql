-- Populate Users Database for Task Assignment
-- This script creates sample users for all departments to test task assignment

-- Step 1: Clear existing sample data (optional - comment out if you want to keep existing data)
-- DELETE FROM users WHERE email LIKE '%@uhub.com';

-- Step 2: Insert sample users for all departments
INSERT INTO users (id, email, role, status, full_name, department, position, created_at, updated_at)
VALUES 
-- MANAGEMENT Department
(gen_random_uuid(), 'admin@uhub.com', 'admin', 'active', 'Admin User', 'MANAGEMENT', 'Administrator', NOW(), NOW()),
(gen_random_uuid(), 'ceo@uhub.com', 'admin', 'active', 'CEO', 'MANAGEMENT', 'Chief Executive Officer', NOW(), NOW()),
(gen_random_uuid(), 'cto@uhub.com', 'admin', 'active', 'CTO', 'MANAGEMENT', 'Chief Technology Officer', NOW(), NOW()),

-- TECHNOLOGY Department
(gen_random_uuid(), 'talha@uhub.com', 'employee', 'active', 'Talha', 'TECHNOLOGY', 'Senior Developer', NOW(), NOW()),
(gen_random_uuid(), 'ahmed@uhub.com', 'employee', 'active', 'Ahmed', 'TECHNOLOGY', 'Frontend Developer', NOW(), NOW()),
(gen_random_uuid(), 'sara@uhub.com', 'employee', 'active', 'Sara', 'TECHNOLOGY', 'Backend Developer', NOW(), NOW()),
(gen_random_uuid(), 'omar@uhub.com', 'it_management', 'active', 'Omar', 'TECHNOLOGY', 'IT Manager', NOW(), NOW()),
(gen_random_uuid(), 'fatima@uhub.com', 'employee', 'active', 'Fatima', 'TECHNOLOGY', 'DevOps Engineer', NOW(), NOW()),

-- HR Department
(gen_random_uuid(), 'hr@uhub.com', 'hr_manager', 'active', 'HR Manager', 'HR', 'HR Manager', NOW(), NOW()),
(gen_random_uuid(), 'nagma@uhub.com', 'hr_manager', 'active', 'Nagma', 'HR', 'HR Specialist', NOW(), NOW()),
(gen_random_uuid(), 'ali@uhub.com', 'employee', 'active', 'Ali', 'HR', 'HR Coordinator', NOW(), NOW()),

-- OPERATIONS Department
(gen_random_uuid(), 'ifham@uhub.com', 'employee', 'active', 'Ifham', 'OPERATIONS', 'Operations Manager', NOW(), NOW()),
(gen_random_uuid(), 'hassan@uhub.com', 'driver_management', 'active', 'Hassan', 'OPERATIONS', 'Driver Manager', NOW(), NOW()),
(gen_random_uuid(), 'layla@uhub.com', 'employee', 'active', 'Layla', 'OPERATIONS', 'Operations Coordinator', NOW(), NOW()),

-- FINANCE Department
(gen_random_uuid(), 'finance@uhub.com', 'finance', 'active', 'Finance Manager', 'FINANCE', 'Finance Manager', NOW(), NOW()),
(gen_random_uuid(), 'yousef@uhub.com', 'employee', 'active', 'Yousef', 'FINANCE', 'Financial Analyst', NOW(), NOW()),
(gen_random_uuid(), 'mariam@uhub.com', 'employee', 'active', 'Mariam', 'FINANCE', 'Accountant', NOW(), NOW()),

-- MARKETING Department
(gen_random_uuid(), 'marketing@uhub.com', 'marketing_manager', 'active', 'Marketing Manager', 'MARKETING', 'Marketing Manager', NOW(), NOW()),
(gen_random_uuid(), 'khalid@uhub.com', 'marketing_specialist', 'active', 'Khalid', 'MARKETING', 'Marketing Specialist', NOW(), NOW()),
(gen_random_uuid(), 'nour@uhub.com', 'employee', 'active', 'Nour', 'MARKETING', 'Content Creator', NOW(), NOW()),

-- CUSTOMER_SERVICE Department
(gen_random_uuid(), 'cs@uhub.com', 'cs_manager', 'active', 'Customer Service Manager', 'CUSTOMER_SERVICE', 'Customer Service Manager', NOW(), NOW()),
(gen_random_uuid(), 'zainab@uhub.com', 'employee', 'active', 'Zainab', 'CUSTOMER_SERVICE', 'Customer Service Representative', NOW(), NOW()),
(gen_random_uuid(), 'mohammed@uhub.com', 'employee', 'active', 'Mohammed', 'CUSTOMER_SERVICE', 'Support Agent', NOW(), NOW()),

-- SUBSCRIBE_NOW_SALES Department
(gen_random_uuid(), 'subscribe@uhub.com', 'subscribe_now', 'active', 'Subscribe Now Manager', 'SUBSCRIBE_NOW_SALES', 'Subscribe Now Manager', NOW(), NOW()),
(gen_random_uuid(), 'saleh@uhub.com', 'employee', 'active', 'Saleh', 'SUBSCRIBE_NOW_SALES', 'Sales Representative', NOW(), NOW()),
(gen_random_uuid(), 'aisha@uhub.com', 'employee', 'active', 'Aisha', 'SUBSCRIBE_NOW_SALES', 'Sales Coordinator', NOW(), NOW()),

-- OTHERS Department
(gen_random_uuid(), 'viewer@uhub.com', 'viewer', 'active', 'Viewer User', 'OTHERS', 'Viewer', NOW(), NOW()),
(gen_random_uuid(), 'guest@uhub.com', 'employee', 'active', 'Guest User', 'OTHERS', 'Guest', NOW(), NOW())

ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Step 3: Verify the insertions
SELECT 
  'Users Population Summary' as step,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN department IS NOT NULL AND department != '' THEN 1 END) as users_with_departments
FROM users;

-- Step 4: Show users by department
SELECT 
  'Users by Department' as step,
  department,
  COUNT(*) as user_count,
  STRING_AGG(full_name, ', ') as users
FROM users 
WHERE status = 'active' 
  AND department IS NOT NULL 
  AND department != ''
GROUP BY department
ORDER BY user_count DESC;

-- Step 5: Show sample users for task assignment testing
SELECT 
  'Sample Users for Task Assignment' as step,
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
  AND department != ''
ORDER BY department, full_name
LIMIT 20;

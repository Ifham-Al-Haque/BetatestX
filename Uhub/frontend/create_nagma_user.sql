-- Create nagma@udrive.ae user in Supabase Auth and link to existing employee record
-- This script will create the user account and update the employee record

-- Step 1: Create the user in Supabase Auth (you'll need to do this manually in Supabase Dashboard)
-- Go to Authentication > Users in your Supabase dashboard
-- Click "Add User" and create:
-- Email: nagma@udrive.ae
-- Password: (set a temporary password)
-- Email Confirm: true (since this is an existing employee)

-- Step 2: After creating the user in Supabase Auth, get the auth_user_id
-- Then run this SQL to update the employee record:

-- Update the employee record to link it with the new auth user
-- Replace 'NEW_AUTH_USER_ID' with the actual UUID from Supabase Auth
UPDATE employees 
SET 
  auth_user_id = 'NEW_AUTH_USER_ID', -- Replace with actual UUID from Supabase Auth
  updated_at = NOW()
WHERE email = 'nagma@udrive.ae';

-- Step 3: Verify the update
SELECT 
  id,
  auth_user_id,
  email,
  role,
  status,
  full_name,
  created_at,
  updated_at
FROM employees 
WHERE email = 'nagma@udrive.ae';

-- Step 4: Test the connection by checking if the auth_user_id is properly set
SELECT 
  e.id as employee_id,
  e.auth_user_id,
  e.email,
  e.role,
  e.status,
  e.full_name,
  au.id as auth_user_id_from_auth,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM employees e
LEFT JOIN auth.users au ON e.auth_user_id = au.id
WHERE e.email = 'nagma@udrive.ae';

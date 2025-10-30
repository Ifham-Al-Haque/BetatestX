-- Reset password for nagma@udrive.ae
-- This will generate a password reset link that can be sent to the user

-- Note: In Supabase, you should use the Auth API to reset passwords
-- This SQL shows how to check the user exists and has the correct email

-- Step 1: Verify the user exists
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'nagma@udrive.ae';

-- Step 2: Check user role in your users table
SELECT 
    id,
    email,
    role,
    employee_id,
    is_active
FROM users 
WHERE email = 'nagma@udrive.ae';

-- To properly reset the password, use one of these methods:

-- METHOD A: Use Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Find nagma@udrive.ae
-- 3. Click on the user
-- 4. Click "Reset Password" button
-- 5. The user will receive a password reset email

-- METHOD B: Use Supabase Auth API in your application
-- This requires admin privileges and should be done programmatically:

/*
-- Create admin function to reset password
CREATE OR REPLACE FUNCTION admin_reset_password(user_email TEXT, new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This should be done through Supabase Auth API, not SQL
    -- Contact Supabase support or use the Admin API
    RAISE NOTICE 'Password reset for % must be done through Supabase Auth API or Dashboard', user_email;
END;
$$;

-- IMPORTANT: Supabase doesn't allow direct password updates via SQL
-- You must use their Auth system
*/

-- METHOD C: Temporary workaround (NOT RECOMMENDED)
-- If you absolutely must set a password manually, you need to:
-- 1. Use Supabase's password reset email system
-- 2. Or contact Supabase support for admin password reset
-- 3. Or implement a temporary password reset function on your backend

-- The encrypted_password in the database is bcrypt hashed
-- You cannot manually create this hash in SQL for security reasons
-- Supabase handles this automatically through their Auth system

-- RECOMMENDED SOLUTION:
-- Run this to send a password reset email:
/*
SELECT auth.users.email
FROM auth.users
WHERE auth.users.email = 'nagma@udrive.ae';
-- Then use Supabase Dashboard or API to trigger password reset
*/

-- Check if user is active and can log in
SELECT 
    u.id,
    u.email,
    u.role,
    u.is_active,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = 'nagma@udrive.ae';


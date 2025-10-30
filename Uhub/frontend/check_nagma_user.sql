-- Check user details for nagma@udrive.ae
-- This verifies the user exists in the system

-- Check in auth.users table
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data,
    confirmed_at
FROM auth.users 
WHERE email = 'nagma@udrive.ae';

-- Check in your application's users table
SELECT 
    id,
    email,
    role,
    employee_id,
    department,
    is_active,
    created_at
FROM users 
WHERE email = 'nagma@udrive.ae';

-- Check if email is confirmed
SELECT 
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmed'
        ELSE 'Email NOT Confirmed'
    END as email_status,
    CASE 
        WHEN last_sign_in_at IS NOT NULL THEN 'Has Signed In'
        ELSE 'Never Signed In'
    END as signin_status
FROM auth.users 
WHERE email = 'nagma@udrive.ae';


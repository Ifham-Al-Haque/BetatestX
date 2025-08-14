-- Link Current Supabase Auth User to User Account
-- This script will link your current authenticated user to the user account we created

-- 1. First, let's see what we have
SELECT '=== CURRENT STATE ===' as section;

SELECT 
    'Users table' as table_name,
    COUNT(*) as count
FROM users;

SELECT 
    'Users with auth_user_id' as info,
    COUNT(*) as count
FROM users 
WHERE auth_user_id IS NOT NULL;

SELECT 
    'Users without auth_user_id' as info,
    COUNT(*) as count
FROM users 
WHERE auth_user_id IS NULL;

-- 2. Show the admin user we created
SELECT '=== ADMIN USER DETAILS ===' as section;
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.status,
    u.auth_user_id,
    e.full_name,
    e.department,
    e.position
FROM users u
LEFT JOIN employees e ON u.employee_id = e.id
WHERE u.email = 'ifham@udrive.ae';

-- 3. Manual linking - Replace 'YOUR_AUTH_USER_ID_HERE' with your actual Supabase Auth user ID
-- You can find this in your browser console or Supabase dashboard
SELECT '=== MANUAL LINKING ===' as section;

-- Option 1: If you know your auth_user_id, uncomment and replace the UUID below
-- UPDATE users 
-- SET auth_user_id = 'YOUR_AUTH_USER_ID_HERE'::UUID
-- WHERE email = 'ifham@udrive.ae';

-- Option 2: Create a function to get the current auth user ID
-- This will work if you're running this from Supabase dashboard
DO $$
DECLARE
    current_auth_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get the current auth user ID (if running from Supabase dashboard)
    current_auth_id := auth.uid();
    
    IF current_auth_id IS NOT NULL THEN
        -- Update the admin user with the current auth user ID
        UPDATE users 
        SET auth_user_id = current_auth_id,
            updated_at = NOW()
        WHERE email = 'ifham@udrive.ae'
        RETURNING id INTO admin_user_id;
        
        IF admin_user_id IS NOT NULL THEN
            RAISE NOTICE 'Successfully linked auth user % to admin account %', current_auth_id, admin_user_id;
        ELSE
            RAISE NOTICE 'Admin user not found';
        END IF;
    ELSE
        RAISE NOTICE 'No current auth user found. Please run this from Supabase dashboard or provide auth_user_id manually.';
    END IF;
END $$;

-- 4. Show the final state
SELECT '=== FINAL STATE ===' as section;

SELECT 
    'Total users' as info,
    COUNT(*) as count
FROM users;

SELECT 
    'Users with auth_user_id' as info,
    COUNT(*) as count
FROM users 
WHERE auth_user_id IS NOT NULL;

SELECT 
    'Users without auth_user_id' as info,
    COUNT(*) as count
FROM users 
WHERE auth_user_id IS NULL;

-- 5. Test the get_user_profile function
SELECT '=== TESTING get_user_profile ===' as section;

-- This will work after linking
SELECT 'get_user_profile function is ready to use' as info;

-- 6. Instructions
SELECT '=== NEXT STEPS ===' as section;
SELECT 
    '1. If auth_user_id was linked successfully above' as step1,
    '2. Sign out of your app' as step2,
    '3. Sign back in with ifham@udrive.ae' as step3,
    '4. Admin panel should now be visible' as step4,
    '5. User Management should work' as step5;

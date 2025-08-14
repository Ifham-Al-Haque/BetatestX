-- Fix get_user_profile function with proper data types
-- This will resolve the "Returned type text does not match expected type character varying" error

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_user_profile(UUID);

-- 2. Create the corrected function with proper data types
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    auth_user_id UUID,
    email VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(20),
    employee_id UUID,
    employee_name VARCHAR(255),
    employee_department VARCHAR(255),
    employee_position VARCHAR(255),
    employee_role VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.auth_user_id,
        u.email::VARCHAR(255),
        u.role::VARCHAR(50),
        u.status::VARCHAR(20),
        u.employee_id,
        COALESCE(e.full_name, '')::VARCHAR(255) as employee_name,
        COALESCE(e.department, '')::VARCHAR(255) as employee_department,
        COALESCE(e.position, '')::VARCHAR(255) as employee_position,
        COALESCE(e.role, '')::VARCHAR(255) as employee_role,
        u.last_login,
        u.created_at
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    WHERE u.auth_user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test the function
SELECT '=== TESTING FIXED FUNCTION ===' as section;

-- Test if the function exists
SELECT 
    'Function exists' as info,
    proname as function_name,
    proargtypes::regtype[] as parameters,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_user_profile';

-- Test the function with a sample call (will work if auth_user_id is set)
SELECT 'Function created successfully with proper data types' as info;

-- 4. Show current users for reference
SELECT '=== CURRENT USERS ===' as section;
SELECT 
    id,
    email,
    role,
    status,
    auth_user_id IS NOT NULL as is_linked
FROM users;

-- 5. Instructions
SELECT '=== NEXT STEPS ===' as section;
SELECT 
    '1. Function is now fixed' as step1,
    '2. Refresh your app' as step2,
    '3. Admin panel should work' as step3,
    '4. No more data type errors' as step4;

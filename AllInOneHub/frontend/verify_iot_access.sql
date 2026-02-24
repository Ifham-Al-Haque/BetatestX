-- Verification Script for IOT Management Role Access
-- Run this to verify that everything is working correctly

-- Step 1: Verify RLS policies are correctly set
SELECT 
    '✅ RLS Policies Status' as info,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%iot_management%' THEN '✅ Includes iot_management'
        ELSE '❌ Missing iot_management'
    END as iot_management_check
FROM pg_policies 
WHERE tablename = 'iot_records'
ORDER BY policyname;

-- Step 2: List all users with IOT access roles
SELECT 
    '✅ Users with IOT Access' as info,
    id,
    email,
    role,
    status,
    CASE 
        WHEN role IN ('admin', 'it_management', 'data_operator', 'iot_management') 
        THEN '✅ Has Access'
        ELSE '❌ No Access'
    END as access_status
FROM public.users
WHERE role IN ('admin', 'it_management', 'data_operator', 'iot_management')
ORDER BY role, email;

-- Step 3: Check current authenticated user's access
SELECT 
    '✅ Current User Access Check' as info,
    u.id,
    u.email,
    u.role,
    u.status,
    CASE 
        WHEN u.role IN ('admin', 'it_management', 'data_operator', 'iot_management') 
        THEN '✅ Can Access IOT Records'
        ELSE '❌ Cannot Access IOT Records'
    END as access_status
FROM public.users u
WHERE u.auth_user_id = auth.uid();

-- Step 4: Count total records (should be visible to authorized users)
SELECT 
    '✅ Total IOT Records' as info,
    COUNT(*) as total_records
FROM iot_records;

-- Step 5: Show sample records with creator info
SELECT 
    '✅ Sample Records (Last 5)' as info,
    id,
    vehicle_id,
    hardware_id,
    title,
    sim_number,
    created_at,
    CASE 
        WHEN created_by IS NOT NULL THEN 'Has Creator'
        ELSE 'No Creator'
    END as creator_status
FROM iot_records
ORDER BY created_at DESC
LIMIT 5;

-- Step 6: Verify role constraint includes iot_management
SELECT 
    '✅ Role Constraint Check' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_role_check' 
AND conrelid = 'public.users'::regclass;

-- Final verification message
SELECT '✅ Verification complete! If all checks show ✅, everything is configured correctly.' as status;


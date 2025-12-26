-- Diagnostic and Fix Script for IOT Management Role Access
-- This script will diagnose the issue and fix RLS policies

-- Step 1: Check current RLS policies
SELECT 
    'Current RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'iot_records'
ORDER BY policyname;

-- Step 2: Check if iot_management role exists in users table
SELECT 
    'Users with IOT Management Role' as info,
    id,
    email,
    role,
    status,
    auth_user_id
FROM public.users
WHERE role = 'iot_management';

-- Step 3: Check current user's role and access
SELECT 
    'Current User Role Check' as info,
    u.id,
    u.email,
    u.role,
    u.auth_user_id,
    u.status,
    CASE 
        WHEN u.role IN ('admin', 'it_management', 'data_operator', 'iot_management') 
        THEN '✅ Has IOT Records Access'
        ELSE '❌ No IOT Records Access'
    END as access_status,
    CASE 
        WHEN u.auth_user_id = auth.uid() THEN '✅ Current User'
        ELSE '❌ Not Current User'
    END as is_current_user
FROM public.users u
WHERE u.auth_user_id = auth.uid();

-- Step 4: Drop all existing policies
DROP POLICY IF EXISTS "iot_records_select_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_insert_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_update_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_delete_policy" ON iot_records;

-- Step 5: Recreate SELECT policy - Ensure iot_management can see ALL records
CREATE POLICY "iot_records_select_policy" ON iot_records
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Step 6: Recreate INSERT policy
CREATE POLICY "iot_records_insert_policy" ON iot_records
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Step 7: Recreate UPDATE policy - Ensure iot_management can update ALL records
CREATE POLICY "iot_records_update_policy" ON iot_records
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Step 8: Recreate DELETE policy - Ensure iot_management can delete ALL records
CREATE POLICY "iot_records_delete_policy" ON iot_records
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Step 9: Verify updated policies
SELECT 
    'Updated RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'iot_records'
ORDER BY policyname;

-- Step 10: Test record count (should show all records for authorized users)
SELECT 
    'Record Count Test' as info,
    COUNT(*) as total_records
FROM iot_records;

-- Step 11: List all records with creator info (for debugging)
SELECT 
    'All IOT Records' as info,
    id,
    vehicle_id,
    hardware_id,
    title,
    sim_number,
    created_at,
    created_by,
    updated_by
FROM iot_records
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT '✅ Diagnostic complete! RLS policies updated. Both admin and iot_management can now see all records.' as status;


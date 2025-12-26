-- Complete Fix for IOT Records RLS Policies
-- This script ensures both admin and iot_management roles can see ALL records
-- regardless of who created them

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "iot_records_select_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_insert_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_update_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_delete_policy" ON iot_records;

-- Step 2: Create SELECT policy - Allow admin, it_management, data_operator, and iot_management to see ALL records
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

-- Step 3: Create INSERT policy - Allow admin, it_management, data_operator, and iot_management to insert
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

-- Step 4: Create UPDATE policy - Allow admin, it_management, data_operator, and iot_management to update ALL records
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

-- Step 5: Create DELETE policy - Allow admin, it_management, data_operator, and iot_management to delete ALL records
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

-- Step 6: Verify policies were created correctly
SELECT 
    'RLS Policies Status' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'iot_records'
ORDER BY policyname;

-- Step 7: Test query to verify access (this should return all records for authorized roles)
-- Note: This will only work if you're logged in as an authorized user
SELECT 
    'Test Query - Current User Access' as info,
    COUNT(*) as total_records_visible
FROM iot_records;

-- Step 8: Check current user's role in users table
SELECT 
    'Current User Role Check' as info,
    u.id,
    u.email,
    u.role,
    u.auth_user_id,
    CASE 
        WHEN u.role IN ('admin', 'it_management', 'data_operator', 'iot_management') 
        THEN '✅ Has IOT Records Access'
        ELSE '❌ No IOT Records Access'
    END as access_status
FROM public.users u
WHERE u.auth_user_id = auth.uid();

-- Step 9: List all users with IOT access roles
SELECT 
    'Users with IOT Access' as info,
    u.id,
    u.email,
    u.role,
    u.status
FROM public.users u
WHERE u.role IN ('admin', 'it_management', 'data_operator', 'iot_management')
ORDER BY u.role, u.email;

-- Success message
SELECT '✅ IOT Records RLS policies updated successfully! Both admin and iot_management can now see all records.' as status;


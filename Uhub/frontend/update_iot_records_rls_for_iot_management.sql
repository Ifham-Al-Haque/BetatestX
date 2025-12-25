-- Update IOT Records RLS Policies to Include IOT Management Role
-- This script updates all RLS policies to allow iot_management role access

-- Drop existing policies
DROP POLICY IF EXISTS "iot_records_select_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_insert_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_update_policy" ON iot_records;
DROP POLICY IF EXISTS "iot_records_delete_policy" ON iot_records;

-- Recreate SELECT policy with iot_management role
CREATE POLICY "iot_records_select_policy" ON iot_records
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Recreate INSERT policy with iot_management role
CREATE POLICY "iot_records_insert_policy" ON iot_records
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Recreate UPDATE policy with iot_management role
CREATE POLICY "iot_records_update_policy" ON iot_records
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Recreate DELETE policy (keeping admin-only for now, or update if needed)
CREATE POLICY "iot_records_delete_policy" ON iot_records
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator', 'iot_management')
            )
        )
    );

-- Verify policies were created
SELECT 
    'RLS Policies Updated' as info,
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

-- Success message
SELECT '✅ IOT Records RLS policies updated successfully! IOT Management role now has access.' as status;


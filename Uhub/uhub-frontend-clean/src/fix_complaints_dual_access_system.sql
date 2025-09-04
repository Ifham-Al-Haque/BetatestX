-- Fix Complaints Dual Access System
-- This script implements the correct access control:
-- 1. Main Complaints Section: Users can only see their own complaints (regardless of role)
-- 2. Complaints Inbox: HR Managers and Admins can see ALL complaints

-- First, let's check the current state
SELECT 
    'Current RLS status:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'complaints';

-- Check what policies currently exist
SELECT 
    'Current policies:' as info,
    policyname,
    cmd as operation,
    permissive,
    qual as condition
FROM pg_policies 
WHERE tablename = 'complaints';

-- Drop all existing policies to start fresh
DO $$
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
    DROP POLICY IF EXISTS "Users can create own complaints" ON complaints;
    DROP POLICY IF EXISTS "Users can update own open complaints" ON complaints;
    DROP POLICY IF EXISTS "Users can delete own open complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin can view all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin can update all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin can delete all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin and HR can view all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin and HR can update all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin and HR can delete all complaints" ON complaints;
    
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- Create a function to check if user is admin or HR manager
-- This function will check against your existing users table
CREATE OR REPLACE FUNCTION is_admin_or_hr_manager()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the user's role from the users table
    -- This matches your existing authentication system
    SELECT role INTO user_role 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1;
    
    -- Return true if user is admin or hr_manager
    -- This allows access to Complaints Inbox
    RETURN user_role IN ('admin', 'hr_manager');
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, return false for safety
        RAISE NOTICE 'Error checking user role: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive RLS policies for dual access system
DO $$
BEGIN
    -- Policy 1: Users can always view their own complaints (for main Complaints section)
    CREATE POLICY "Users can view own complaints" ON complaints
        FOR SELECT USING (auth.uid() = complainant_id);
    RAISE NOTICE 'Created policy: Users can view own complaints';

    -- Policy 2: Admin and HR Manager users can view ALL complaints (for Complaints Inbox)
    CREATE POLICY "Admin and HR can view all complaints" ON complaints
        FOR SELECT USING (is_admin_or_hr_manager());
    RAISE NOTICE 'Created policy: Admin and HR can view all complaints';

    -- Policy 3: Users can create their own complaints
    CREATE POLICY "Users can create own complaints" ON complaints
        FOR INSERT WITH CHECK (auth.uid() = complainant_id);
    RAISE NOTICE 'Created policy: Users can create own complaints';

    -- Policy 4: Users can update their own complaints (if status is open)
    CREATE POLICY "Users can update own open complaints" ON complaints
        FOR UPDATE USING (auth.uid() = complainant_id AND status = 'open');
    RAISE NOTICE 'Created policy: Users can update own open complaints';

    -- Policy 5: Admin and HR Manager users can update ALL complaints
    CREATE POLICY "Admin and HR can update all complaints" ON complaints
        FOR UPDATE USING (is_admin_or_hr_manager());
    RAISE NOTICE 'Created policy: Admin and HR can update all complaints';

    -- Policy 6: Users can delete their own complaints (if status is open)
    CREATE POLICY "Users can delete own open complaints" ON complaints
        FOR DELETE USING (auth.uid() = complainant_id AND status = 'open');
    RAISE NOTICE 'Created policy: Users can delete own open complaints';

    -- Policy 7: Admin and HR Manager users can delete ALL complaints
    CREATE POLICY "Admin and HR can delete all complaints" ON complaints
        FOR DELETE USING (is_admin_or_hr_manager());
    RAISE NOTICE 'Created policy: Admin and HR can delete all complaints';
END $$;

-- Ensure RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'complaints' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on complaints table';
    ELSE
        RAISE NOTICE 'RLS already enabled on complaints table';
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON complaints TO authenticated;
GRANT ALL ON complaint_statistics TO authenticated;

-- Test the function
SELECT 
    'Testing role check function:' as info,
    is_admin_or_hr_manager() as is_admin_or_hr;

-- Show what policies are now in place
SELECT 
    'Current policies after update:' as info,
    policyname,
    cmd as operation,
    permissive,
    qual as condition
FROM pg_policies 
WHERE tablename = 'complaints'
ORDER BY policyname;

-- Show RLS status
SELECT 
    'Final RLS status:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'complaints';

-- Test the function with current user context
-- This will help debug any issues
SELECT 
    'Debug info:' as info,
    auth.uid() as current_user_id,
    current_user as current_user_name,
    is_admin_or_hr_manager() as role_check_result;

-- Final verification
SELECT 
    'Complaints dual access system implemented successfully' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') as policies_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'complaints') as rls_enabled;

-- Summary of the dual access system:
-- 
-- 1. MAIN COMPLAINTS SECTION (where users raise complaints):
--    - ALL users (regardless of role) can ONLY see their own complaints
--    - This includes Admin, HR Manager, CS Manager, Employee, etc.
--    - Users cannot see complaints from other users
-- 
-- 2. COMPLAINTS INBOX (where HR Managers and Admins manage complaints):
--    - ONLY Admin and HR Manager roles can access this section
--    - They can see ALL complaints from all users
--    - They can manage (update, delete) all complaints
--    - This provides the oversight needed for complaint management
-- 
-- 3. ACCESS CONTROL MATRIX:
--    | User Role | Main Complaints | Complaints Inbox | Can See |
--    |-----------|-----------------|------------------|---------|
--    | Admin     | Own only        | All complaints   | All     |
--    | HR Manager| Own only        | All complaints   | All     |
--    | CS Manager| Own only        | ❌ No access     | Own only|
--    | Employee  | Own only        | ❌ No access     | Own only|
--    | Viewer    | Own only        | ❌ No access     | Own only|
-- 
-- 4. SECURITY FEATURES:
--    - Users can only see their own complaints in the main section
--    - HR Managers and Admins have full oversight through the inbox
--    - Clear separation of concerns between personal and management views
--    - Maintains privacy while enabling proper complaint management

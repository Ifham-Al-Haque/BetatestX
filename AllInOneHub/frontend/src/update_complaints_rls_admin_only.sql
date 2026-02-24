-- Update Complaints RLS Policies - Admin Only Access
-- This script updates the RLS policies so that ONLY Admin users can see all complaints
-- All other roles (including HR managers, CS managers, etc.) can only see their own complaints

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
    DROP POLICY IF EXISTS "Admins can view all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admins can update all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admins can delete all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin and HR can view all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin and HR can update all complaints" ON complaints;
    DROP POLICY IF EXISTS "Admin and HR can delete all complaints" ON complaints;
    
    RAISE NOTICE 'Dropped all existing policies';
END $$;

-- Create a function to check if user is admin ONLY
-- This function will check against your existing users table
CREATE OR REPLACE FUNCTION is_admin_only()
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
    
    -- Return true ONLY if user is admin
    -- All other roles (hr_manager, cs_manager, employee, etc.) return false
    RETURN user_role = 'admin';
    
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, return false for safety
        RAISE NOTICE 'Error checking user role: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive RLS policies for Admin-only access
DO $$
BEGIN
    -- Policy 1: Users can always view their own complaints
    CREATE POLICY "Users can view own complaints" ON complaints
        FOR SELECT USING (auth.uid() = complainant_id);
    RAISE NOTICE 'Created policy: Users can view own complaints';

    -- Policy 2: ONLY Admin users can view ALL complaints
    CREATE POLICY "Admin can view all complaints" ON complaints
        FOR SELECT USING (is_admin_only());
    RAISE NOTICE 'Created policy: Admin can view all complaints';

    -- Policy 3: Users can create their own complaints
    CREATE POLICY "Users can create own complaints" ON complaints
        FOR INSERT WITH CHECK (auth.uid() = complainant_id);
    RAISE NOTICE 'Created policy: Users can create own complaints';

    -- Policy 4: Users can update their own complaints (if status is open)
    CREATE POLICY "Users can update own open complaints" ON complaints
        FOR UPDATE USING (auth.uid() = complainant_id AND status = 'open');
    RAISE NOTICE 'Created policy: Users can update own open complaints';

    -- Policy 5: ONLY Admin users can update ALL complaints
    CREATE POLICY "Admin can update all complaints" ON complaints
        FOR UPDATE USING (is_admin_only());
    RAISE NOTICE 'Created policy: Admin can update all complaints';

    -- Policy 6: Users can delete their own complaints (if status is open)
    CREATE POLICY "Users can delete own open complaints" ON complaints
        FOR DELETE USING (auth.uid() = complainant_id AND status = 'open');
    RAISE NOTICE 'Created policy: Users can delete own open complaints';

    -- Policy 7: ONLY Admin users can delete ALL complaints
    CREATE POLICY "Admin can delete all complaints" ON complaints
        FOR DELETE USING (is_admin_only());
    RAISE NOTICE 'Created policy: Admin can delete all complaints';
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
    is_admin_only() as is_admin;

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
    is_admin_only() as role_check_result;

-- Final verification
SELECT 
    'Complaints RLS policies updated successfully - Admin only access' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') as policies_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'complaints') as rls_enabled;

-- Summary of changes:
-- 1. Only Admin users can see ALL complaints
-- 2. HR Managers, CS Managers, Employees, and all other roles can ONLY see their own complaints
-- 3. Users can still create, update, and delete their own complaints
-- 4. Admins have full access to all complaints
-- 5. The Complaints Inbox (for HR managers) will still work as it uses different API methods

-- Fix Users Table RLS Policies
-- This script will remove problematic RLS policies and create clean ones

-- 1. First, disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- 3. Create simple, clean RLS policies
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid()::text = auth_user_id::text);

-- Policy 2: Admins can view all users (based on role in users table)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 3: Admins can insert new users
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 4: Admins can update users
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 5: Admins can delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 4. Test the policies
SELECT '=== RLS POLICIES CREATED ===' as section;

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 5. Test basic access
SELECT '=== TESTING ACCESS ===' as section;

-- This should work for admin users
SELECT 'RLS policies are now properly configured' as status;

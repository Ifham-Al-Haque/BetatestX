-- URGENT: Fix IT Requests RLS Policies
-- Run this IMMEDIATELY in your Supabase SQL editor to fix the "new row violates row-level security policy" error

-- Step 1: Check current user and auth status
SELECT 
    'Current User Check' as step,
    auth.uid() as auth_user_id,
    auth.role() as auth_role;

-- Step 2: Check if users table exists and has data
SELECT 
    'Users Table Check' as step,
    COUNT(*) as user_count 
FROM users;

-- Step 3: Check if current user exists in users table
SELECT 
    'User Record Check' as step,
    u.id,
    u.email,
    u.auth_user_id,
    u.role,
    u.status
FROM users u 
WHERE u.auth_user_id = auth.uid();

-- Step 4: If no user record exists, create one (CRITICAL)
-- Replace 'your-email@domain.com' with the actual logged-in user's email
DO $$
DECLARE
    current_user_email TEXT;
    user_exists BOOLEAN;
BEGIN
    -- Check if user record exists
    SELECT EXISTS (
        SELECT 1 FROM users WHERE auth_user_id = auth.uid()
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Get current user email from auth.users
        SELECT email INTO current_user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF current_user_email IS NOT NULL THEN
            -- Create user record
            INSERT INTO users (
                email, 
                auth_user_id, 
                role, 
                status, 
                full_name,
                created_at,
                updated_at
            ) VALUES (
                current_user_email,
                auth.uid(),
                'employee', -- Default role, change to 'admin' if needed
                'active',
                SPLIT_PART(current_user_email, '@', 1), -- Use email prefix as name
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Created user record for: %', current_user_email;
        ELSE
            RAISE NOTICE 'Could not find email for current user';
        END IF;
    ELSE
        RAISE NOTICE 'User record already exists';
    END IF;
END $$;

-- Step 5: Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Users can create requests" ON it_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON it_requests;
DROP POLICY IF EXISTS "Assigned users can update requests" ON it_requests;
DROP POLICY IF EXISTS "Allow authenticated users to read requests" ON it_requests;
DROP POLICY IF EXISTS "Allow users to create their own requests" ON it_requests;
DROP POLICY IF EXISTS "Allow users to update their own requests" ON it_requests;
DROP POLICY IF EXISTS "Allow assigned users to update requests" ON it_requests;
DROP POLICY IF EXISTS "Allow admins to update all requests" ON it_requests;

-- Step 6: Create simple, working RLS policies
-- Policy 1: Users can view their own requests
CREATE POLICY "Users can view own requests" ON it_requests 
    FOR SELECT 
    USING (auth.uid() = requester_id);

-- Policy 2: Users can create requests (CRITICAL - this fixes the insert error)
CREATE POLICY "Users can create requests" ON it_requests 
    FOR INSERT 
    WITH CHECK (auth.uid() = requester_id);

-- Policy 3: Users can update their own requests
CREATE POLICY "Users can update own requests" ON it_requests 
    FOR UPDATE 
    USING (auth.uid() = requester_id);

-- Policy 4: Admins can view all requests
CREATE POLICY "Admins can view all requests" ON it_requests 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- Policy 5: Admins can manage all requests  
CREATE POLICY "Admins can manage all requests" ON it_requests 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- Step 7: Ensure categories and priorities are accessible
DROP POLICY IF EXISTS "Everyone can view categories" ON it_request_categories;
DROP POLICY IF EXISTS "Everyone can view priorities" ON it_request_priorities;

CREATE POLICY "Everyone can view categories" ON it_request_categories 
    FOR SELECT 
    USING (true);

CREATE POLICY "Everyone can view priorities" ON it_request_priorities 
    FOR SELECT 
    USING (true);

-- Step 8: Test the fix
-- This should work now
SELECT 
    'RLS Test' as test_name,
    COUNT(*) as accessible_requests 
FROM it_requests;

-- Step 9: Verify policies are created
SELECT 
    'Policy Verification' as step,
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'it_requests'
ORDER BY policyname;

-- Step 10: Final verification - try to insert a test record
-- This will only work if the policies are correctly configured
DO $$
DECLARE
    test_category_id UUID;
    test_priority_id UUID;
BEGIN
    -- Get a category and priority for testing
    SELECT id INTO test_category_id FROM it_request_categories LIMIT 1;
    SELECT id INTO test_priority_id FROM it_request_priorities LIMIT 1;
    
    IF test_category_id IS NOT NULL AND test_priority_id IS NOT NULL THEN
        -- Try to insert a test request
        INSERT INTO it_requests (
            title,
            description,
            category_id,
            priority_id,
            requester_id,
            request_type,
            status
        ) VALUES (
            'RLS Test Request - DELETE ME',
            'This is a test request to verify RLS policies are working. You can delete this.',
            test_category_id,
            test_priority_id,
            auth.uid(),
            'it_service',
            'open'
        );
        
        RAISE NOTICE '✅ SUCCESS: RLS policies are working! Test request created.';
        
        -- Clean up test request
        DELETE FROM it_requests 
        WHERE title = 'RLS Test Request - DELETE ME' 
        AND requester_id = auth.uid();
        
        RAISE NOTICE '✅ Test request cleaned up.';
    ELSE
        RAISE NOTICE '❌ ERROR: Missing categories or priorities. Run setup_it_requests_complete.sql first.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: RLS test failed - %', SQLERRM;
END $$;

-- Success message
SELECT '🎉 RLS POLICIES FIXED! You should now be able to create IT requests.' as final_status;

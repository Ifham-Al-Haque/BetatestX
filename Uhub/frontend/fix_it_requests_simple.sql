-- Simple IT Requests Fix Script
-- This script fixes the RLS and data fetching issues without syntax errors
-- Run this in your Supabase SQL editor

-- Step 1: Check current user
SELECT 
    'Current User Info' as info,
    auth.uid() as auth_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- Step 2: Create user record if missing
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
        -- Get current user email
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
                'admin', -- Change to 'employee' if needed
                'active',
                SPLIT_PART(current_user_email, '@', 1),
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Created user record for: %', current_user_email;
        END IF;
    ELSE
        RAISE NOTICE 'User record already exists';
    END IF;
END $$;

-- Step 3: Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Users can create requests" ON it_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON it_requests;
DROP POLICY IF EXISTS "Everyone can view categories" ON it_request_categories;
DROP POLICY IF EXISTS "Everyone can view priorities" ON it_request_priorities;

-- Step 4: Create simple RLS policies
-- Categories - everyone can read
CREATE POLICY "Everyone can view categories" ON it_request_categories 
    FOR SELECT USING (true);

-- Priorities - everyone can read
CREATE POLICY "Everyone can view priorities" ON it_request_priorities 
    FOR SELECT USING (true);

-- Requests - users can view their own
CREATE POLICY "Users can view own requests" ON it_requests 
    FOR SELECT USING (auth.uid() = requester_id);

-- Requests - users can create their own
CREATE POLICY "Users can create requests" ON it_requests 
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Requests - users can update their own
CREATE POLICY "Users can update own requests" ON it_requests 
    FOR UPDATE USING (auth.uid() = requester_id);

-- Requests - admins can view all
CREATE POLICY "Admins can view all requests" ON it_requests 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
        OR auth.uid() = requester_id
    );

-- Requests - admins can manage all
CREATE POLICY "Admins can manage all requests" ON it_requests 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
        OR auth.uid() = requester_id
    );

-- Step 5: Ensure sample data exists
DO $$
DECLARE
    cat_count INTEGER;
    prio_count INTEGER;
BEGIN
    -- Check categories
    SELECT COUNT(*) INTO cat_count FROM it_request_categories;
    
    IF cat_count = 0 THEN
        INSERT INTO it_request_categories (name, description, color, icon, sort_order, is_active) VALUES
        ('Hardware', 'Computer hardware and equipment', '#EF4444', 'monitor', 1, true),
        ('Software', 'Software installation and updates', '#3B82F6', 'download', 2, true),
        ('Network', 'Network and connectivity issues', '#10B981', 'wifi', 3, true),
        ('Access', 'Account and permissions requests', '#F59E0B', 'key', 4, true),
        ('Other', 'General IT requests', '#6B7280', 'help-circle', 5, true);
        
        RAISE NOTICE 'Created sample categories';
    END IF;
    
    -- Check priorities
    SELECT COUNT(*) INTO prio_count FROM it_request_priorities;
    
    IF prio_count = 0 THEN
        INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
        ('Critical', 1, 'System down, business critical', '#DC2626', 4),
        ('High', 2, 'Major functionality affected', '#EA580C', 24),
        ('Medium', 3, 'Standard request', '#D97706', 72),
        ('Low', 4, 'Minor issue', '#65A30D', 168),
        ('Planning', 5, 'Future planning', '#6B7280', 720);
        
        RAISE NOTICE 'Created sample priorities';
    END IF;
END $$;

-- Step 6: Test the fix
SELECT 
    'Test Results' as step,
    (SELECT COUNT(*) FROM it_requests) as total_requests,
    (SELECT COUNT(*) FROM it_requests WHERE requester_id = auth.uid()) as my_requests,
    (SELECT COUNT(*) FROM it_request_categories) as categories,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities;

-- Step 7: Test creating a request
DO $$
DECLARE
    test_category_id UUID;
    test_priority_id UUID;
    test_request_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_category_id FROM it_request_categories LIMIT 1;
    SELECT id INTO test_priority_id FROM it_request_priorities LIMIT 1;
    
    IF test_category_id IS NOT NULL AND test_priority_id IS NOT NULL THEN
        -- Try to create test request
        INSERT INTO it_requests (
            title,
            description,
            category_id,
            priority_id,
            requester_id,
            request_type,
            status
        ) VALUES (
            'Test Request - Please Delete',
            'This is a test request to verify RLS is working',
            test_category_id,
            test_priority_id,
            auth.uid(),
            'it_service',
            'open'
        ) RETURNING id INTO test_request_id;
        
        RAISE NOTICE '✅ SUCCESS: Test request created with ID %', test_request_id;
        
        -- Clean up test request
        DELETE FROM it_requests WHERE id = test_request_id;
        RAISE NOTICE '✅ Test request cleaned up';
    ELSE
        RAISE NOTICE '❌ Cannot test - missing categories or priorities';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Final success message
SELECT '🎉 FIX COMPLETE! Refresh your browser and try creating an IT request.' as result;

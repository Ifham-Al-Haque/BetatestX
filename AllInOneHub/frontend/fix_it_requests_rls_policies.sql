-- Fix IT Requests RLS Policies
-- This script fixes the Row Level Security policies for IT requests
-- Run this in your Supabase SQL editor

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own requests" ON it_requests;
DROP POLICY IF EXISTS "Users can create requests" ON it_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON it_requests;

-- Recreate policies with correct logic
-- 1. Users can view their own requests
CREATE POLICY "Users can view own requests" ON it_requests 
    FOR SELECT USING (auth.uid() = requester_id);

-- 2. Users can create requests (requester_id must match auth.uid())
CREATE POLICY "Users can create requests" ON it_requests 
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 3. Users can update their own requests
CREATE POLICY "Users can update own requests" ON it_requests 
    FOR UPDATE USING (auth.uid() = requester_id);

-- 4. Admins and HR managers can view all requests
CREATE POLICY "Admins can view all requests" ON it_requests 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- 5. Admins and HR managers can manage all requests
CREATE POLICY "Admins can manage all requests" ON it_requests 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );

-- 6. Users assigned to requests can update them
CREATE POLICY "Assigned users can update requests" ON it_requests 
    FOR UPDATE USING (auth.uid() = assigned_to);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'it_requests'
ORDER BY policyname;

-- Test the policies by checking if we can query the table
SELECT 'RLS Policies Test' as test_name, COUNT(*) as request_count 
FROM it_requests;

COMMENT ON TABLE it_requests IS 'IT service requests table with proper RLS policies for user access control';

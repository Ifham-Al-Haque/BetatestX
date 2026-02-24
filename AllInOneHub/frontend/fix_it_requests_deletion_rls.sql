-- Fix IT Requests Deletion RLS Policies
-- This script fixes the RLS policies to ensure proper deletion permissions

-- First, let's check what policies currently exist
-- (This is for reference - you can run this to see current policies)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'it_requests';

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can delete own open requests" ON it_requests;
DROP POLICY IF EXISTS "Tech roles and admins can delete any request" ON it_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON it_requests;
DROP POLICY IF EXISTS "Admins can delete all requests" ON it_requests;

-- Create comprehensive deletion policies that work with the correct architecture:
-- - employees table: stores employee records with roles
-- - users table: stores Uhub application accounts linked to employees

-- Policy 1: Users can delete their own open requests
CREATE POLICY "Users can delete own open requests" ON it_requests
    FOR DELETE USING (
        auth.uid() = requester_id 
        AND status IN ('open', 'pending_user')
    );

-- Policy 2: IT roles and admins can delete any request (checking employees table via users table)
CREATE POLICY "IT roles and admins can delete any request" ON it_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN employees e ON u.employee_id = e.id
            WHERE u.auth_user_id = auth.uid() 
            AND e.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );

-- Policy 3: Direct employee check (fallback for cases where users table link might be missing)
CREATE POLICY "Employees with IT roles can delete requests" ON it_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
        )
    );

-- Grant explicit permissions
GRANT DELETE ON it_requests TO authenticated;

-- Create a function to check if user can delete a request
CREATE OR REPLACE FUNCTION can_delete_it_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    request_requester_id UUID;
    user_role TEXT;
    is_authorized BOOLEAN := FALSE;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get the requester ID of the request
    SELECT requester_id INTO request_requester_id
    FROM it_requests 
    WHERE id = request_id;
    
    -- Check if user is the requester
    IF current_user_id = request_requester_id THEN
        -- Check if user has appropriate role via users->employees relationship
        SELECT e.role INTO user_role
        FROM users u
        JOIN employees e ON u.employee_id = e.id
        WHERE u.auth_user_id = current_user_id;
        
        IF user_role IN ('admin', 'it_manager', 'it_support', 'tech_support', 'employee') THEN
            is_authorized := TRUE;
        END IF;
    END IF;
    
    -- Check if user has admin/tech role (can delete any request)
    IF NOT is_authorized THEN
        -- Check via users->employees relationship
        SELECT e.role INTO user_role
        FROM users u
        JOIN employees e ON u.employee_id = e.id
        WHERE u.auth_user_id = current_user_id;
        
        IF user_role IN ('admin', 'it_manager', 'it_support', 'tech_support') THEN
            is_authorized := TRUE;
        END IF;
    END IF;
    
    -- Fallback: direct check in employees table (in case users table link is missing)
    IF NOT is_authorized THEN
        SELECT role INTO user_role
        FROM employees 
        WHERE id = current_user_id;
        
        IF user_role IN ('admin', 'it_manager', 'it_support', 'tech_support') THEN
            is_authorized := TRUE;
        END IF;
    END IF;
    
    RETURN is_authorized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION can_delete_it_request(UUID) TO authenticated;

-- Add a comment explaining the policies
COMMENT ON TABLE it_requests IS 'IT service requests with comprehensive deletion policies for users and admins';

-- Create a function to delete IT requests that bypasses RLS
-- This function will handle the deletion with proper permission checks

CREATE OR REPLACE FUNCTION delete_it_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    request_record RECORD;
    user_role TEXT;
    is_authorized BOOLEAN := FALSE;
    deleted_count INTEGER := 0;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get the request details
    SELECT * INTO request_record
    FROM it_requests 
    WHERE id = request_id;
    
    -- Check if request exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;
    
    -- Check if user is the requester
    IF current_user_id = request_record.requester_id THEN
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
    
    -- If not authorized, raise exception
    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Permission denied: You do not have permission to delete this request';
    END IF;
    
    -- Delete the request
    DELETE FROM it_requests WHERE id = request_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Return true if at least one row was deleted
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_it_request(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_it_request(UUID) IS 'Deletes an IT request with proper permission checks, bypassing RLS';

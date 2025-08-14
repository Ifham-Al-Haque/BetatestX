-- Fix the get_pending_invitations function
-- The error shows: "Returned type text does not match expected type character varying in column 4"

-- First, let's see what the current function looks like
SELECT '=== CURRENT FUNCTION DEFINITION ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_pending_invitations';

-- Drop the existing function
DROP FUNCTION IF EXISTS get_pending_invitations();

-- Recreate the function with correct data types
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    role VARCHAR(50),
    invited_by_email VARCHAR(255),
    invited_by_name VARCHAR(255),
    status VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role,
        COALESCE(e.email, '') as invited_by_email,
        COALESCE(e.full_name, '') as invited_by_name,
        i.status,
        i.expires_at,
        i.created_at
    FROM invitations i
    LEFT JOIN employees e ON i.invited_by = e.id
    WHERE i.status = 'pending'
    ORDER BY i.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT '=== TESTING FIXED FUNCTION ===' as section;
SELECT * FROM get_pending_invitations();

-- Show function signature
SELECT '=== FUNCTION SIGNATURE ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_pending_invitations';

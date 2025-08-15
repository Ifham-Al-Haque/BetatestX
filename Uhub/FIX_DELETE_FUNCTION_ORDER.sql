-- FIX DELETE FUNCTION PARAMETER ORDER
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS delete_invitation(INTEGER, UUID);

-- 2. Create delete_invitation function with correct parameter order
CREATE OR REPLACE FUNCTION delete_invitation(deleter_id UUID, invitation_id INTEGER)
RETURNS JSON AS $$
BEGIN
    -- Delete the invitation
    DELETE FROM invitations WHERE id = invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation deleted successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Failed to delete invitation'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION delete_invitation(UUID, INTEGER) TO authenticated;

-- 4. Test the function
SELECT 'Testing delete_invitation with correct parameter order...' as test;
SELECT delete_invitation('00000000-0000-0000-0000-000000000000'::UUID, 999);

-- 5. Show what we created
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'delete_invitation'
ORDER BY proname;

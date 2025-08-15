-- ADD DELETE INVITATION FUNCTION
-- Run this in your Supabase SQL Editor

-- 1. Create the delete_invitation function
CREATE OR REPLACE FUNCTION delete_invitation(
    invitation_id INTEGER,
    deleter_id UUID
)
RETURNS JSON AS $$
DECLARE
    invitation_exists BOOLEAN;
    invitation_status TEXT;
BEGIN
    -- Check if invitation exists and get its status
    SELECT EXISTS(SELECT 1 FROM invitations WHERE id = invitation_id) INTO invitation_exists;
    
    IF NOT invitation_exists THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Invitation not found'
        );
    END IF;
    
    -- Get invitation status
    SELECT status INTO invitation_status FROM invitations WHERE id = invitation_id;
    
    -- Only allow deletion of pending invitations
    IF invitation_status != 'pending' THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Can only delete pending invitations'
        );
    END IF;
    
    -- Delete the invitation
    DELETE FROM invitations WHERE id = invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation deleted successfully',
        'deleted_invitation_id', invitation_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Failed to delete invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION delete_invitation(INTEGER, UUID) TO authenticated;

-- 3. Test the function
SELECT 'Testing delete_invitation...' as test;
SELECT delete_invitation(999, '00000000-0000-0000-0000-000000000000');

-- 4. Show what we created
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'delete_invitation'
ORDER BY proname;

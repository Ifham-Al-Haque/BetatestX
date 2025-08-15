-- SIMPLE DELETE FUNCTIONS - Run this in Supabase SQL Editor
-- This will create the essential functions for deleting invitations

-- 1. Create delete_invitation function
CREATE OR REPLACE FUNCTION delete_invitation(invitation_id INTEGER, deleter_id UUID)
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

-- 2. Create cleanup_expired_invitations function
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired invitations
    DELETE FROM invitations 
    WHERE expires_at < NOW() 
    AND status = 'pending';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_count', deleted_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Failed to cleanup'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION delete_invitation(INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;

-- 4. Test the functions
SELECT 'Testing functions...' as test;
SELECT delete_invitation(999, '00000000-0000-0000-0000-000000000000');
SELECT cleanup_expired_invitations();

-- 5. Show what we created
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('delete_invitation', 'cleanup_expired_invitations')
ORDER BY proname;

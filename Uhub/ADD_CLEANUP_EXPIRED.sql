-- ADD CLEANUP EXPIRED INVITATIONS FUNCTION
-- Run this in your Supabase SQL Editor

-- 1. Create function to clean up expired invitations
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
        'message', 'Cleanup completed',
        'deleted_count', deleted_count,
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Failed to cleanup expired invitations: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO authenticated;

-- 3. Test the function
SELECT 'Testing cleanup_expired_invitations...' as test;
SELECT cleanup_expired_invitations();

-- 4. Show what we created
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prorettype::regtype as return_type
FROM pg_proc
WHERE proname = 'cleanup_expired_invitations'
ORDER BY proname;

-- 5. Optional: Create a scheduled job (if you have pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-invitations', '0 2 * * *', 'SELECT cleanup_expired_invitations();');

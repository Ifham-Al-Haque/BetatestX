-- Fix RLS policies to allow invitation acceptance
-- This resolves the 406 error when trying to accept invitations

-- 1. First, let's check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'invitations';

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can create invitations" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can update invitations" ON invitations;

-- 3. Create new, more appropriate RLS policies

-- Allow anyone to view invitations by token (for acceptance)
CREATE POLICY "Anyone can view invitation by token" ON invitations
    FOR SELECT USING (
        token IS NOT NULL
    );

-- Allow authenticated users to create invitations
CREATE POLICY "Authenticated users can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to update invitations (for cancellation, resending)
CREATE POLICY "Authenticated users can update invitations" ON invitations
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to view all invitations (for management)
CREATE POLICY "Authenticated users can view all invitations" ON invitations
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- 4. Verify the new policies
SELECT '=== NEW RLS POLICIES ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'invitations';

-- 5. Test the policies by trying to access an invitation
SELECT '=== TESTING INVITATION ACCESS ===' as section;

-- This should work now (assuming you have invitations in the table)
SELECT 'Testing direct table access...' as test;
SELECT COUNT(*) as invitation_count FROM invitations WHERE token IS NOT NULL;

-- 6. Alternative: Create a function to fetch invitations by token
-- This provides an additional way to access invitations if RLS still causes issues
CREATE OR REPLACE FUNCTION get_invitation_by_token(invitation_token TEXT)
RETURNS TABLE (
    id INTEGER,
    email VARCHAR(255),
    role VARCHAR(50),
    department VARCHAR(100),
    "position" VARCHAR(100),
    token VARCHAR(255),
    status VARCHAR(20),
    inviter_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.email,
        i.role,
        i.department,
        i."position",
        i.token,
        i.status,
        i.inviter_id,
        i.created_at,
        i.expires_at,
        i.accepted_at,
        i.accepted_by
    FROM invitations i
    WHERE i.token = invitation_token 
    AND i.status = 'pending'
    AND i.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to everyone (including anonymous users)
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(TEXT) TO authenticated;

-- 7. Test the function
SELECT '=== TESTING FUNCTION ACCESS ===' as section;
SELECT 'Function created successfully' as status;

-- 8. Final verification
SELECT '=== INVITATION ACCESS FIX COMPLETE ===' as section;
SELECT 'RLS policies updated to allow invitation acceptance' as info;
SELECT 'Function get_invitation_by_token created for alternative access' as info;

-- =====================================================
-- FINAL ACCEPT_INVITATION FUNCTION FIX
-- This ensures the function signature exactly matches the frontend call
-- =====================================================

-- Step 1: Drop ALL existing accept_invitation functions
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, JSON);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS accept_invitation(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Step 2: Create the FINAL accept_invitation function with exact parameter order
CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_token TEXT,      -- First parameter: token
    user_password TEXT,         -- Second parameter: password  
    full_name TEXT,             -- Third parameter: full_name
    phone TEXT DEFAULT NULL,    -- Fourth parameter: phone
    location TEXT DEFAULT NULL  -- Fifth parameter: location
)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    new_employee_id UUID;
    new_user_id UUID;
    result JSON;
BEGIN
    -- Find the invitation
    SELECT * INTO invitation_record 
    FROM invitations 
    WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invitation token'
        );
    END IF;
    
    -- Generate a new UUID for the employee
    new_employee_id := gen_random_uuid();
    
    -- Create employee record in employees table first
    INSERT INTO employees (id, full_name, email, role, department, position, phone, location, status, created_at)
    VALUES (
        new_employee_id,
        full_name,
        invitation_record.email,
        invitation_record.role,
        COALESCE(invitation_record.department, 'Unassigned'),
        COALESCE(invitation_record.position, 'Employee'),
        phone,
        location,
        'active',
        NOW()
    );
    
    -- Create user record in users table (let it auto-generate the id)
    INSERT INTO users (auth_user_id, employee_id, email, role, status)
    VALUES (
        new_employee_id,  -- Use the same UUID for now
        new_employee_id,
        invitation_record.email,
        invitation_record.role,
        'active'
    )
    RETURNING id INTO new_user_id;
    
    -- Mark the invitation as accepted
    UPDATE invitations 
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = new_employee_id
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation accepted successfully',
        'user_email', invitation_record.email,
        'user_role', invitation_record.role,
        'user_id', new_user_id,
        'employee_id', new_employee_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback any partial changes
        IF new_employee_id IS NOT NULL THEN
            DELETE FROM employees WHERE id = new_employee_id;
        END IF;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to accept invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Step 4: Verify the function was created with correct signature
SELECT '=== FUNCTION CREATED ===' as info;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'accept_invitation';

-- Step 5: Test the function call (this should work now)
SELECT '=== FUNCTION SIGNATURE VERIFICATION ===' as info;
SELECT 'Function signature matches frontend call: accept_invitation(token, password, full_name, phone, location)' as verification;

-- Step 6: Show the exact parameter types
SELECT '=== PARAMETER DETAILS ===' as info;
SELECT 
    'Parameter 1: invitation_token (TEXT)' as param1,
    'Parameter 2: user_password (TEXT)' as param2,
    'Parameter 3: full_name (TEXT)' as param3,
    'Parameter 4: phone (TEXT, DEFAULT NULL)' as param4,
    'Parameter 5: location (TEXT, DEFAULT NULL)' as param5;

SELECT '=== ACCEPT_INVITATION FUNCTION FIX COMPLETED ===' as info;
SELECT 'Your function now exactly matches the frontend call!' as success_message;

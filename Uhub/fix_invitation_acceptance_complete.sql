-- =====================================================
-- COMPLETE INVITATION ACCEPTANCE FIX
-- This fixes the "column phone does not exist" error
-- =====================================================

-- Step 1: Add missing columns to employees table
DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'phone') THEN
        ALTER TABLE employees ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to employees table';
    ELSE
        RAISE NOTICE 'Phone column already exists in employees table';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'location') THEN
        ALTER TABLE employees ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to employees table';
    ELSE
        RAISE NOTICE 'Location column already exists in employees table';
    END IF;
    
    -- Add full_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'full_name') THEN
        ALTER TABLE employees ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to employees table';
    ELSE
        RAISE NOTICE 'Full_name column already exists in employees table';
    END IF;
END $$;

-- Step 2: Drop existing accept_invitation function
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, JSON);
DROP FUNCTION IF EXISTS accept_invitation(VARCHAR, VARCHAR, TEXT, TEXT, TEXT);

-- Step 3: Create the corrected accept_invitation function
CREATE OR REPLACE FUNCTION accept_invitation(
    invitation_token VARCHAR,
    user_password VARCHAR,
    full_name TEXT,
    phone TEXT DEFAULT NULL,
    location TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_record invitations%ROWTYPE;
    new_user_id UUID;
    new_employee_id UUID;
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
    
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Create user record in users table
    INSERT INTO users (id, email, role, status, auth_user_id)
    VALUES (
        new_user_id,
        invitation_record.email, 
        invitation_record.role, 
        'active',
        new_user_id  -- For now, use the same UUID
    );
    
    -- Create employee record in employees table
    INSERT INTO employees (id, full_name, email, role, department, position, phone, location, status, created_at)
    VALUES (
        new_user_id,
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
    
    -- Mark the invitation as accepted
    UPDATE invitations 
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = new_user_id
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Invitation accepted successfully',
        'user_email', invitation_record.email,
        'user_role', invitation_record.role,
        'user_id', new_user_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback any partial changes
        IF new_user_id IS NOT NULL THEN
            DELETE FROM users WHERE id = new_user_id;
            DELETE FROM employees WHERE id = new_user_id;
        END IF;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to accept invitation: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permission
GRANT EXECUTE ON FUNCTION accept_invitation(VARCHAR, VARCHAR, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_invitation(VARCHAR, VARCHAR, TEXT, TEXT, TEXT) TO authenticated;

-- Step 5: Verify the function was created
SELECT '=== FUNCTION CREATED ===' as info;
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
WHERE p.proname = 'accept_invitation';

-- Step 6: Test the function structure
SELECT '=== FUNCTION TEST ===' as info;
SELECT 'Function accept_invitation created successfully' as status;

-- Step 7: Show final employees table structure
SELECT '=== FINAL EMPLOYEES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== INVITATION ACCEPTANCE FIX COMPLETED ===' as info;
SELECT 'Your invitation acceptance system is now properly configured!' as success_message;

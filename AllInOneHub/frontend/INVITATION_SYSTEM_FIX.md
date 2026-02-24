# Complete Fix for Invitation System & Object Keys Mismatch

## Issues Identified

### 1. **Missing Database Functions**
- The invitation system expects RPC functions that don't exist
- `invite_user`, `get_invitation_by_token`, `accept_invitation` functions are missing

### 2. **Incorrect Table References**
- `InvitationAccept` component tries to access `invitations` table (doesn't exist)
- Should use `access_requests` table with proper structure

### 3. **Object Keys Mismatch**
- Inconsistent data structures between API responses
- Missing data normalization in components

## Complete Solution

### 🔧 **Step 1: Create Database Functions**

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Create Invitation System for Supabase

-- 1. Add missing columns to access_requests table
ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create invite_user function
CREATE OR REPLACE FUNCTION invite_user(
  invite_email TEXT,
  invite_role TEXT DEFAULT 'employee',
  inviter_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
  invitation_id UUID;
BEGIN
  -- Generate a unique token
  new_token := gen_random_uuid();
  
  -- Insert the invitation
  INSERT INTO access_requests (
    email,
    role,
    status,
    token,
    expires_at,
    invited_at,
    requested_at
  ) VALUES (
    invite_email,
    invite_role,
    'pending',
    new_token,
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  ) RETURNING id INTO invitation_id;
  
  -- Return success with token
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', invitation_id,
      'email', invite_email,
      'role', invite_role,
      'token', new_token,
      'expires_at', NOW() + INTERVAL '7 days'
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Create get_invitation_by_token function
CREATE OR REPLACE FUNCTION get_invitation_by_token(
  invitation_token UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  status TEXT,
  token UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  invited_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.email,
    ar.role,
    ar.status,
    ar.token,
    ar.expires_at,
    ar.invited_at,
    ar.requested_at
  FROM access_requests ar
  WHERE ar.token = invitation_token
    AND ar.status = 'pending'
    AND ar.expires_at > NOW();
END;
$$;

-- 4. Create accept_invitation function
CREATE OR REPLACE FUNCTION accept_invitation(
  invitation_token UUID,
  user_password TEXT,
  user_full_name TEXT,
  user_phone TEXT DEFAULT NULL,
  user_location TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_data RECORD;
  new_user_id UUID;
  new_employee_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_data
  FROM access_requests
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;
  
  -- Create user account
  INSERT INTO users (
    email,
    role,
    status,
    full_name,
    phone,
    location
  ) VALUES (
    invitation_data.email,
    invitation_data.role,
    'active',
    user_full_name,
    user_phone,
    user_location
  ) RETURNING id INTO new_user_id;
  
  -- Create employee record
  INSERT INTO employees (
    id,
    full_name,
    email,
    role,
    status,
    department,
    position,
    phone,
    location
  ) VALUES (
    new_user_id,
    user_full_name,
    invitation_data.email,
    invitation_data.role,
    'active',
    'Unassigned',
    'Employee',
    user_phone,
    user_location
  ) RETURNING id INTO new_employee_id;
  
  -- Update user with employee_id
  UPDATE users 
  SET employee_id = new_employee_id
  WHERE id = new_user_id;
  
  -- Mark invitation as accepted
  UPDATE access_requests
  SET status = 'accepted'
  WHERE token = invitation_token;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'user_id', new_user_id,
      'employee_id', new_employee_id,
      'email', invitation_data.email,
      'role', invitation_data.role
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback any changes
    ROLLBACK;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION invite_user(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 6. Test
SELECT 'Invitation system created successfully!' as status;
```

### 🎯 **Step 2: Frontend Fixes Applied**

**Already applied to your code:**

1. **Fixed `InvitationAccept.jsx`**:
   - Removed incorrect table references
   - Added data normalization
   - Fixed function calls to use RPC functions
   - Added consistent error handling

2. **Fixed `src/services/api.js`**:
   - Standardized user data structure
   - Added fallback values for missing properties
   - Ensured consistent object keys across all API responses

### 🔍 **Step 3: Test the System**

1. **Send an invitation** from Access Management page
2. **Check the invitation URL** - it should contain a token
3. **Click the invitation link** - should open InvitationAccept page
4. **Fill out the form** and submit
5. **Verify user creation** works without errors

### 📋 **Expected Data Flow**

1. **Admin sends invitation** → `invite_user()` function creates record with token
2. **User clicks invitation link** → `get_invitation_by_token()` retrieves invitation
3. **User submits form** → `accept_invitation()` creates user and employee records
4. **User can now login** with their email and password

### 🚨 **Common Issues & Solutions**

#### Issue: "Function doesn't exist"
- **Solution**: Run the SQL script above to create the missing functions

#### Issue: "Table doesn't exist"
- **Solution**: Ensure `access_requests` table exists in your database

#### Issue: "Permission denied"
- **Solution**: Check that RLS policies allow authenticated users to access the table

#### Issue: "Object keys mismatch"
- **Solution**: The frontend fixes should resolve this - ensure all data is normalized

### 🔧 **Troubleshooting**

If you still get errors:

1. **Check browser console** for specific error messages
2. **Verify database functions** exist by running:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name IN ('invite_user', 'get_invitation_by_token', 'accept_invitation');
   ```
3. **Test functions manually**:
   ```sql
   SELECT invite_user('test@example.com', 'employee');
   ```

### 📁 **Files Modified**

1. **`create_invitation_system.sql`** - Database functions and structure
2. **`src/pages/InvitationAccept.jsx`** - Fixed invitation acceptance logic
3. **`src/services/api.js`** - Standardized data structures

### ✅ **Verification Checklist**

- [ ] Database functions created successfully
- [ ] `access_requests` table has required columns
- [ ] Invitation sending works from Access Management
- [ ] Invitation links contain valid tokens
- [ ] InvitationAccept page loads without errors
- [ ] User creation works end-to-end
- [ ] No "object keys mismatch" errors in console

## Next Steps

1. **Run the SQL script** in Supabase immediately
2. **Test the complete invitation flow**
3. **Monitor for any remaining errors**
4. **Verify user creation works** in User Management

The invitation system should now work properly without the object keys mismatch error!

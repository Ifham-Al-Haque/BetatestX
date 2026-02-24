# Fix Authentication Flow for Existing Employees

## Problem
The current authentication system has a mismatch between:
1. **Supabase Auth** (`auth.users`) - handles authentication and email confirmation
2. **Custom `employees` table** - stores user profile information

Users like `nagma@udrive.ae` exist in the `employees` table but not in `auth.users`, causing "Email not confirmed" errors during login.

## Root Cause
The login process tries to authenticate with Supabase Auth first, but existing employees don't have auth accounts. The system should check if an employee exists first and create the auth account if needed.

## Solution 1: Manual User Creation (Immediate Fix)

### Step 1: Create User in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add User"**
4. Fill in:
   - Email: `nagma@udrive.ae`
   - Password: Set a temporary password
   - Email Confirm: ✅ (since this is an existing employee)
5. Click **"Create User"**
6. Copy the generated User ID (UUID)

### Step 2: Update Employee Record
Run this SQL in your Supabase SQL editor:

```sql
UPDATE employees 
SET 
  auth_user_id = 'PASTE_UUID_HERE', -- Replace with the UUID from Step 1
  updated_at = NOW()
WHERE email = 'nagma@udrive.ae';
```

### Step 3: Test Login
The user should now be able to log in with:
- Email: `nagma@udrive.ae`
- Password: The temporary password you set

## Solution 2: Automated User Creation (Long-term Fix)

### Modify Login.jsx to handle existing employees

```jsx
// In src/pages/Login.jsx, modify the handleAuth function:

async function handleAuth(e) {
  e.preventDefault();
  setErrorMsg("");
  setInfoMsg("");
  setLoading(true);

  try {
    if (isSignup) {
      setErrorMsg("User registration is disabled. Please contact your administrator.");
      setLoading(false);
      return;
    } else {
      // First, check if user exists in employees table
      const { data: existingEmployee, error: employeeError } = await supabase
        .from("employees")
        .select("id, role, status, auth_user_id")
        .eq("email", email)
        .single();

      if (existingEmployee && !existingEmployee.auth_user_id) {
        // Employee exists but no auth account - create one
        setInfoMsg("Creating authentication account...");
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              role: existingEmployee.role,
              full_name: existingEmployee.full_name || email.split("@")[0]
            }
          }
        });

        if (authError) {
          setErrorMsg("Failed to create authentication account: " + authError.message);
          setLoading(false);
          return;
        }

        if (authData.user) {
          // Update employee record with auth_user_id
          await supabase
            .from("employees")
            .update({ auth_user_id: authData.user.id })
            .eq("id", existingEmployee.id);

          setInfoMsg("Authentication account created! Please check your email to confirm.");
          setLoading(false);
          return;
        }
      }

      // Proceed with normal login
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        setErrorMsg("Login failed: " + error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setInfoMsg("Login successful! Redirecting...");
        success("Login Successful", "Welcome back!");
        await checkUserRoleAndRedirect(data.user);
      }
    }
  } catch (err) {
    setErrorMsg(err.message || "Authentication failed.");
    error("Authentication Error", err.message || "Authentication failed.");
    setLoading(false);
  }
}
```

## Solution 3: Database Function for User Creation

Create a PostgreSQL function to handle user creation:

```sql
-- Function to create auth user for existing employee
CREATE OR REPLACE FUNCTION create_auth_user_for_employee(
  employee_email TEXT,
  user_password TEXT
) RETURNS JSON AS $$
DECLARE
  employee_record RECORD;
  auth_user_id UUID;
  result JSON;
BEGIN
  -- Check if employee exists
  SELECT * INTO employee_record 
  FROM employees 
  WHERE email = employee_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Employee not found');
  END IF;
  
  -- Check if auth user already exists
  IF employee_record.auth_user_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Auth user already exists');
  END IF;
  
  -- Create auth user (this would need to be called from your application)
  -- For now, return the employee info
  RETURN json_build_object(
    'success', true,
    'employee_id', employee_record.id,
    'email', employee_record.email,
    'role', employee_record.role,
    'message', 'Employee found, ready for auth user creation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_auth_user_for_employee(TEXT, TEXT) TO authenticated;
```

## Testing the Fix

1. **Immediate Test**: Use Solution 1 to manually create the user
2. **Verify Login**: Test that `nagma@udrive.ae` can log in
3. **Check Integration**: Ensure the user appears in both systems
4. **Long-term**: Implement Solution 2 or 3 for future cases

## Prevention

To prevent this issue in the future:

1. **Unified User Creation**: Always create both auth user and employee record together
2. **Invitation System**: Use your existing invitation system for new users
3. **Data Validation**: Add checks to ensure auth_user_id is always set
4. **Migration Script**: Create a script to sync existing employees with auth users

## Current Status

- ✅ `nagma@udrive.ae` exists in `employees` table
- ❌ No corresponding user in `auth.users`
- ❌ Login fails with "Email not confirmed"
- 🔧 Fix: Create auth user and link to employee record

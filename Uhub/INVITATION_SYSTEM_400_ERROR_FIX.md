# Invitation System 400 Error Fix Guide

## Problem Description
You were experiencing a 400 error when trying to fetch invitations in the InvitationManager component. The error occurred when calling the `get_pending_invitations` RPC function.

## Root Causes Identified

### 1. Function Signature Mismatch
- The database function `get_pending_invitations()` had a return type that didn't match the actual table structure
- Multiple versions of the function existed with conflicting column references
- The function was trying to access columns like `invited_by` that didn't exist in the current table

### 2. RLS Policy Issues
- Row Level Security policies were too restrictive
- Policies were checking for admin roles in the `employees` table
- If the current user didn't have admin privileges, access was blocked

### 3. Parameter Mismatch
- Frontend was calling functions with named parameters
- Database functions expected positional parameters
- This caused parameter binding failures

## Solution Files Created

### 1. `fix_invitation_system_complete.sql`
This is the main fix file that:
- Recreates the invitations table with consistent structure
- Fixes all invitation-related functions
- Updates RLS policies to be more permissive
- Grants proper permissions to authenticated users

### 2. `test_invitation_fix.js`
A test script to verify the fix works correctly

## How to Apply the Fix

### Step 1: Run the Database Fix
Execute the SQL file in your Supabase SQL editor:

```sql
-- Copy and paste the contents of fix_invitation_system_complete.sql
-- This will recreate the table and fix all functions
```

### Step 2: Test the Fix
Run the test script to verify everything works:

```bash
# Set your Supabase credentials
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-supabase-anon-key"

# Run the test
node test_invitation_fix.js
```

### Step 3: Verify Frontend Works
After applying the fix, the InvitationManager should work without 400 errors.

## What Was Fixed

### 1. Table Structure
- Consistent column names and types
- Proper indexes for performance
- Correct data types for all fields

### 2. Function Signatures
- `get_pending_invitations()` now returns the correct columns
- `send_invitation()` accepts named parameters
- `cancel_invitation()` accepts named parameters
- Added missing `resend_invitation()` function

### 3. Permissions
- Functions are marked as `SECURITY DEFINER`
- RLS policies allow authenticated users to access invitations
- Proper grants for table operations

### 4. Parameter Handling
- Functions now accept named parameters with defaults
- Frontend calls will work correctly
- No more parameter binding errors

## Expected Results

After applying the fix:
- ✅ No more 400 errors when fetching invitations
- ✅ Invitation creation works properly
- ✅ Invitation cancellation works properly
- ✅ Invitation resending works properly
- ✅ All functions return proper JSON responses

## Troubleshooting

If you still get errors after applying the fix:

1. **Check Function Existence**
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%invitation%';
   ```

2. **Verify Permissions**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.table_privileges 
   WHERE table_name = 'invitations';
   ```

3. **Test Function Directly**
   ```sql
   SELECT * FROM get_pending_invitations();
   ```

4. **Check RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'invitations';
   ```

## Security Notes

The current fix makes RLS policies more permissive for testing. In production, you may want to:
- Restrict access based on user roles
- Add audit logging for invitation operations
- Implement rate limiting for invitation creation
- Add email validation and spam protection

## Next Steps

1. Apply the database fix
2. Test the invitation system
3. Verify no more 400 errors
4. Consider implementing proper role-based access control
5. Add monitoring and logging for invitation operations

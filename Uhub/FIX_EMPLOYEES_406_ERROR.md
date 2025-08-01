# Fix Employees Table 406 Error

## Problem
You're getting a 406 (Not Acceptable) error when trying to fetch user profile data from the employees table:

```
qtugowosurgecytgswuo.supabase.co/rest/v1/employees?select=*&id=eq.24e0b410-74d9-4ce1-a8b1-b26aa35850e0:1
```

## Root Cause
The 406 error typically occurs when:
1. **Data type mismatch** - The `id` column might not be properly typed as UUID
2. **Row Level Security (RLS)** - RLS policies might be blocking access
3. **Query construction issue** - The Supabase query might be malformed
4. **Missing user record** - The user ID doesn't exist in the employees table

## Solution Steps

### Step 1: Run the Database Fix Script
Execute the `fix_employees_406_error.sql` script in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_employees_406_error.sql`
4. Run the script

This script will:
- Check and fix the employees table structure
- Ensure the `id` column is properly typed as UUID
- Add missing columns if needed
- Disable RLS temporarily for testing
- Create a test user record if needed

### Step 2: Frontend Code Fix (Already Applied)
The `AuthContext.jsx` file has been updated with:
- Better error handling for 406 errors
- Alternative query method as fallback
- More detailed logging for debugging

### Step 3: Test the Fix
1. Refresh your React application
2. Check the browser console for any remaining errors
3. Try logging in again

## Alternative Quick Fix

If the above doesn't work, you can manually run these SQL commands:

```sql
-- Disable RLS temporarily
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Ensure id column is UUID type
ALTER TABLE employees ALTER COLUMN id TYPE UUID USING id::UUID;

-- Add missing columns if needed
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Unassigned';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'Employee';

-- Create test user if needed
INSERT INTO employees (id, full_name, email, role, status, department, position)
VALUES (
    '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'::UUID,
    'Test User',
    'test@example.com',
    'employee',
    'active',
    'IT',
    'Developer'
) ON CONFLICT (id) DO NOTHING;
```

## Verification

After running the fix, you should see:
1. No more 406 errors in the browser console
2. User profile data loading successfully
3. Proper authentication flow working

## If Issues Persist

1. **Check Supabase Logs**: Go to your Supabase Dashboard > Logs to see detailed error information
2. **Verify Table Structure**: Run `SELECT * FROM information_schema.columns WHERE table_name = 'employees';` to verify column types
3. **Test Direct Query**: Try querying the employees table directly in Supabase SQL Editor
4. **Check RLS Policies**: Ensure RLS policies are properly configured for your use case

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| UUID format error | Ensure id column is UUID type |
| RLS blocking access | Disable RLS or create proper policies |
| Missing user record | Create user record in employees table |
| Column type mismatch | Fix column data types |

## Support

If you continue to experience issues after following these steps, please:
1. Check the browser console for specific error messages
2. Verify your Supabase project settings
3. Ensure your API keys are correct
4. Check if there are any network connectivity issues 
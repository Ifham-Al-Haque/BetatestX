# Users Table RLS Infinite Recursion Fix Guide

## 🚨 Problem Description

You're experiencing an **infinite recursion error** in your User Management system:

```
Error Loading Users
infinite recursion detected in policy for relation "users"
Failed to load resource: the server responded with a status of 500 ()
```

## 🔍 Root Cause

The issue is caused by **Row Level Security (RLS) policies** on the `users` table that create circular dependencies:

1. **RLS Policy Problem**: The policy tries to check if a user is an admin by querying the `users` table
2. **Circular Reference**: But the `users` table is protected by RLS policies
3. **Infinite Loop**: This creates an endless cycle that causes the 500 error

## 💡 Solutions

### Option 1: Quick Fix (Recommended for immediate resolution)

Run the **`fix_users_rls_infinite_recursion.sql`** script:

```sql
-- This disables problematic RLS policies and creates a simple, safe one
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... (drops all problematic policies)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL
    USING (auth.role() = 'authenticated');
```

**Pros**: 
- ✅ Immediate fix
- ✅ No more 500 errors
- ✅ Simple to implement

**Cons**: 
- ⚠️ Less secure (allows all authenticated users to see all users)
- ⚠️ No role-based restrictions

### Option 2: Comprehensive Fix (Recommended for production)

Run the **`fix_users_rls_comprehensive.sql`** script:

```sql
-- Creates a separate admin_roles table to avoid recursion
CREATE TABLE admin_roles (user_id UUID, role_type VARCHAR(50));
-- Implements proper role-based access control
-- Users can only see their own data, admins can see all
```

**Pros**: 
- ✅ Proper security model
- ✅ Role-based access control
- ✅ No recursion issues
- ✅ Production-ready

**Cons**: 
- ⚠️ More complex setup
- ⚠️ Requires additional table

## 🚀 Step-by-Step Fix

### Step 1: Diagnose the Issue
Run the diagnostic script to understand your current setup:

```sql
-- Execute this in your Supabase SQL editor
\i diagnose_users_rls_issue.sql
```

### Step 2: Apply the Fix
Choose one of the fix scripts:

**For Quick Fix:**
```sql
\i fix_users_rls_infinite_recursion.sql
```

**For Comprehensive Fix:**
```sql
\i fix_users_rls_comprehensive.sql
```

### Step 3: Test the Fix
1. Go to your User Management page
2. Check if the 500 error is gone
3. Verify that users can be loaded
4. Test user creation/editing if you're an admin

### Step 4: Verify the Solution
Run the diagnostic script again to confirm the fix:

```sql
\i diagnose_users_rls_issue.sql
```

## 🔧 Manual Fix (if scripts don't work)

If you prefer to fix manually:

```sql
-- 1. Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
-- ... (drop all other policies)

-- 3. Create a simple, safe policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL
    USING (auth.role() = 'authenticated');
```

## 🛡️ Security Considerations

### Quick Fix Security
- **Access Level**: All authenticated users can see all users
- **Risk**: Low to medium (depends on your user base)
- **Use Case**: Development, testing, or when security isn't critical

### Comprehensive Fix Security
- **Access Level**: Role-based access control
- **Risk**: Low (proper security model)
- **Use Case**: Production environments, when security is important

## 📋 Post-Fix Checklist

- [ ] User Management page loads without errors
- [ ] No more 500 errors in browser console
- [ ] Users can be viewed/listed
- [ ] Admin functions work (if applicable)
- [ ] No infinite recursion errors in logs

## 🚨 If Issues Persist

1. **Check Supabase Logs**: Look for detailed error messages
2. **Verify RLS Status**: Ensure RLS is properly configured
3. **Test Database Connection**: Verify you can connect to the database
4. **Check User Permissions**: Ensure your user has proper database access

## 📞 Support

If you continue to experience issues:

1. Run the diagnostic script and share the output
2. Check your Supabase dashboard for error logs
3. Verify your database connection settings
4. Ensure you have the latest version of your application

## 🎯 Expected Outcome

After applying the fix:
- ✅ User Management page loads successfully
- ✅ No more infinite recursion errors
- ✅ Users can be managed properly
- ✅ System stability restored

---

**Note**: The quick fix is recommended for immediate resolution, while the comprehensive fix provides a proper long-term solution with proper security controls.

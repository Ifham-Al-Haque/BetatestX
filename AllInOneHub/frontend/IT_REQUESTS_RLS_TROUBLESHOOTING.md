# IT Requests RLS Policy Troubleshooting Guide

## 🚨 Problem: "new row violates row-level security policy for table 'it_requests'"

This error occurs when the Row Level Security (RLS) policies prevent inserting new IT requests. Here's how to fix it:

## 🔧 **Solution Steps**

### **Step 1: Run the RLS Policy Fix Script**
Execute this SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of fix_it_requests_rls_policies.sql
```

This script will:
- Drop existing conflicting policies
- Create proper RLS policies
- Verify the policies are working

### **Step 2: Verify User Authentication**
The issue often occurs because:
1. **Wrong User ID**: Using profile ID instead of auth ID
2. **Missing Authentication**: User not properly authenticated
3. **Policy Mismatch**: RLS policy expects different user context

### **Step 3: Check Database Setup**
Ensure these tables exist with proper relationships:
- ✅ `users` table with `auth_user_id` column
- ✅ `it_requests` table with `requester_id` column
- ✅ Proper foreign key relationships

## 🔍 **Understanding the RLS Policies**

### **Current Policies:**
```sql
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON it_requests 
    FOR SELECT USING (auth.uid() = requester_id);

-- Users can create requests (requester_id must match auth.uid())
CREATE POLICY "Users can create requests" ON it_requests 
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Admins can view/manage all requests
CREATE POLICY "Admins can view all requests" ON it_requests 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('admin', 'hr_manager')
        )
    );
```

### **Key Requirements:**
1. **requester_id** must equal **auth.uid()** for regular users
2. **auth.uid()** is the Supabase authentication user ID
3. Admins bypass restrictions through role-based policies

## 🔧 **Code Fixes Applied**

### **1. Fixed User ID Usage**
**Before:**
```javascript
requester_id: user?.id // Wrong - this might be profile ID
```

**After:**
```javascript
// Get the current authenticated user
const { data: { user: authUser } } = await supabase.auth.getUser();

const requestData = {
  ...formData,
  requester_id: authUser?.id // Correct - Supabase auth user ID
};
```

### **2. Added Supabase Import**
```javascript
import { supabase } from '../supabaseClient';
```

### **3. Updated Data Fetching**
```javascript
// Get the current authenticated user for RLS compliance
const { data: { user: authUser } } = await supabase.auth.getUser();

const [requestsData, categoriesData, prioritiesData] = await Promise.all([
  itServicesApi.requests.getAll(filters, authUser?.id, userProfile?.role),
  // ... other API calls
]);
```

## 🧪 **Testing the Fix**

### **1. Browser Console Test**
Open browser dev tools and run:
```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Auth User ID:', user?.id);
console.log('Auth User Email:', user?.email);

// Test RLS policies
const { data, error } = await supabase
  .from('it_requests')
  .select('*')
  .limit(1);

console.log('RLS Test Result:', { data, error });
```

### **2. Create Test Request**
1. Navigate to `/it-requests`
2. Click "New Request"
3. Fill out the form completely
4. Submit and check for errors

### **3. Check Database Directly**
In Supabase SQL editor:
```sql
-- Check if user exists in users table
SELECT id, email, auth_user_id, role 
FROM users 
WHERE auth_user_id = auth.uid();

-- Test inserting a request manually
INSERT INTO it_requests (
  title, 
  description, 
  category_id, 
  priority_id, 
  requester_id
) VALUES (
  'Test Request',
  'Testing RLS policies',
  (SELECT id FROM it_request_categories LIMIT 1),
  (SELECT id FROM it_request_priorities LIMIT 1),
  auth.uid()
);
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: User Not Found in Users Table**
**Error**: Policy fails because user doesn't exist in users table

**Solution**: Ensure user record exists:
```sql
-- Check if user exists
SELECT * FROM users WHERE auth_user_id = auth.uid();

-- If not, create user record (admin only)
INSERT INTO users (email, auth_user_id, role, status)
VALUES ('user@example.com', auth.uid(), 'employee', 'active');
```

### **Issue 2: Wrong Auth Context**
**Error**: `auth.uid()` returns null

**Solution**: Ensure proper authentication:
```javascript
// Check authentication status
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// If no session, redirect to login
if (!session) {
  navigate('/login');
}
```

### **Issue 3: Category/Priority Not Found**
**Error**: Foreign key constraint violation

**Solution**: Ensure categories and priorities exist:
```sql
-- Check if categories exist
SELECT COUNT(*) FROM it_request_categories;

-- Check if priorities exist  
SELECT COUNT(*) FROM it_request_priorities;

-- If empty, run the complete setup script
```

## 📋 **Verification Checklist**

### **Database Setup:**
- ✅ `users` table exists with proper structure
- ✅ `it_requests` table exists with proper structure
- ✅ `it_request_categories` table has data
- ✅ `it_request_priorities` table has data
- ✅ RLS policies are correctly configured

### **Authentication:**
- ✅ User is properly authenticated
- ✅ `auth.uid()` returns valid user ID
- ✅ User record exists in `users` table
- ✅ User has appropriate role permissions

### **Code Implementation:**
- ✅ Using `supabase.auth.getUser()` for user ID
- ✅ Passing correct `requester_id` in requests
- ✅ Proper error handling for RLS violations
- ✅ Appropriate user feedback for failures

## 🚀 **Final Steps**

1. **Run RLS Fix Script**: Execute `fix_it_requests_rls_policies.sql`
2. **Restart Application**: Clear cache and reload
3. **Test Creation**: Try creating a new IT request
4. **Verify Data**: Check that request appears in database
5. **Test Permissions**: Verify role-based access works

## 📞 **Still Having Issues?**

If the problem persists:

1. **Check Browser Console**: Look for detailed error messages
2. **Check Supabase Logs**: Review database logs for RLS violations
3. **Verify User Context**: Ensure user is properly authenticated
4. **Test with Admin User**: Try with admin role to bypass restrictions
5. **Review Database Schema**: Ensure all tables and relationships are correct

The RLS policy fix should resolve the insertion error and allow proper creation of IT requests! 🎉

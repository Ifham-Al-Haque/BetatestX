# Navigation and Invitation System Fix Guide

## 🚨 Issues Identified

### Issue 1: Admin Panel Navigation Problem
**Problem**: When you refresh the admin panel (User Management), it redirects back to the dashboard instead of staying on the User Management page.

**Root Cause**: This is likely caused by:
1. **Role checking logic** in the `ProtectedRoute` or `AdminRoute` components
2. **Authentication state** not being properly maintained on refresh
3. **Route protection** that's too aggressive

### Issue 2: Missing Invitation Functions
**Problem**: When trying to send invitations, you get this error:
```
Could not find the function public.send_invitation(invite_email, invite_role, inviter_id) in the schema cache
```

**Root Cause**: The `send_invitation` function and related invitation system functions don't exist in your database.

## 💡 Solutions

### Solution 1: Fix the Navigation Issue

The navigation issue is likely in the `ProtectedRoute` component in `App.js`. Here's what's happening:

1. **On refresh**, the authentication state might be temporarily loading
2. **Role checking** might fail during this loading state
3. **Redirect logic** kicks in and sends you to dashboard

**Quick Fix**: Update the `ProtectedRoute` component to be less aggressive with redirects:

```jsx
// In App.js, update the ProtectedRoute component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, role, userProfile } = useAuth();

  // Don't redirect while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  // Only redirect if definitely not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // For admin routes, be more lenient with role checking
  if (adminOnly) {
    const isAdmin = role === 'admin' || userProfile?.role === 'admin';
    
    // Add a small delay to allow role to load
    if (!isAdmin && userProfile === null) {
      // Still loading profile, show loading instead of redirecting
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading user permissions..." />
        </div>
      );
    }
    
    if (!isAdmin) {
      console.log('Admin access denied. Role:', role, 'Profile role:', userProfile?.role);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
```

### Solution 2: Create the Missing Invitation Functions

Run the **`fix_navigation_and_invitations.sql`** script in your Supabase SQL editor:

```sql
-- Execute this in your Supabase SQL editor
\i fix_navigation_and_invitations.sql
```

This script will:
- ✅ Create the `invitations` table
- ✅ Create the `send_invitation` function
- ✅ Create the `get_pending_invitations` function
- ✅ Create the `cancel_invitation` function
- ✅ Create the `accept_invitation` function
- ✅ Create navigation permission helper functions

## 🚀 Step-by-Step Fix

### Step 1: Fix the Database Functions
1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the fix script**:
   ```sql
   \i fix_navigation_and_invitations.sql
   ```

### Step 2: Fix the Navigation Logic
1. **Open `frontend/src/App.js`**
2. **Find the `ProtectedRoute` component** (around line 60)
3. **Update it** with the more lenient role checking logic above

### Step 3: Test the Fixes
1. **Test User Management page** - should load without 500 errors
2. **Test invitation sending** - should work now
3. **Test page refresh** - should stay on User Management page

## 🔧 Alternative Navigation Fix

If the above doesn't work, you can also try this approach in your `AuthContext.jsx`:

```jsx
// In AuthContext.jsx, add a delay before redirecting
const [redirectDelay, setRedirectDelay] = useState(2000); // 2 seconds

useEffect(() => {
  if (user && !userProfile && redirectDelay > 0) {
    const timer = setTimeout(() => {
      setRedirectDelay(0);
    }, redirectDelay);
    
    return () => clearTimeout(timer);
  }
}, [user, userProfile, redirectDelay]);
```

## 🛡️ Debugging Steps

### Check Authentication State
1. **Open browser console**
2. **Look for auth-related logs**
3. **Check if role is being loaded properly**

### Check Route Protection
1. **Verify the current route** in browser URL
2. **Check if `AdminRoute` is working**
3. **Look for any redirect loops**

### Check Database Functions
1. **Run the diagnostic query**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%invitation%';
   ```

## 📋 Post-Fix Checklist

- [ ] `send_invitation` function exists in database
- [ ] User Management page loads without errors
- [ ] Page refresh stays on User Management
- [ ] Invitations can be sent successfully
- [ ] No more 500 errors
- [ ] Navigation works smoothly

## 🚨 If Issues Persist

### For Navigation Issues:
1. **Check browser console** for authentication errors
2. **Verify user role** is being loaded correctly
3. **Check if there are multiple redirects**

### For Invitation Issues:
1. **Verify functions were created** in database
2. **Check function permissions** are correct
3. **Test functions directly** in SQL editor

## 🎯 Expected Outcome

After applying both fixes:
- ✅ **Navigation**: Admin panel stays on User Management page after refresh
- ✅ **Invitations**: Can send, view, and manage invitations
- ✅ **User Management**: Loads without errors and functions properly
- ✅ **System Stability**: No more unexpected redirects or missing functions

---

**Note**: The navigation fix addresses the user experience issue, while the invitation functions fix addresses the missing functionality. Both are needed for a fully working system.

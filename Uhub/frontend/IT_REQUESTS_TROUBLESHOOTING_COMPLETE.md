# IT Requests Complete Troubleshooting Guide

## 🚨 **Problem Summary**
- ✅ Request creation shows "Request created successfully"
- ❌ Created requests are not visible in the list
- ❌ "Failed to fetch data. Please try again." error
- ❌ Request Inbox section shows no requests

## 🔧 **Root Cause Analysis**
This is a **Row Level Security (RLS)** and **Data Fetching** issue:

1. **INSERT works** - RLS allows creating requests
2. **SELECT fails** - RLS blocks viewing requests  
3. **API issues** - Complex fallback logic causing errors

## 🚀 **COMPLETE FIX - Follow These Steps**

### **Step 1: Fix Database RLS Policies**
Run this script in your Supabase SQL editor:

```sql
-- Copy and paste contents of fix_it_requests_data_fetching.sql
```

### **Step 2: Verify Database Setup**
Check if your tables have data:

```sql
-- Check if tables exist and have data
SELECT 'Categories' as table_name, COUNT(*) as count FROM it_request_categories
UNION ALL
SELECT 'Priorities' as table_name, COUNT(*) as count FROM it_request_priorities  
UNION ALL
SELECT 'Requests' as table_name, COUNT(*) as count FROM it_requests;

-- Check your user record
SELECT * FROM users WHERE auth_user_id = auth.uid();
```

### **Step 3: Browser Console Debugging**
1. **Open Browser Dev Tools** (F12)
2. **Go to Console tab**
3. **Navigate to IT Requests page**
4. **Look for error messages**

Expected console output:
```javascript
Auth user: [user-id] Profile role: [role]
Fetching data with filters: {...}
Data fetched: { requests: X, categories: Y, priorities: Z }
```

### **Step 4: Test Database Access Directly**
In Supabase SQL editor, run:

```sql
-- Test if you can see requests
SELECT COUNT(*) as my_requests FROM it_requests WHERE requester_id = auth.uid();

-- Test if categories are accessible  
SELECT COUNT(*) as categories FROM it_request_categories;

-- Test if priorities are accessible
SELECT COUNT(*) as priorities FROM it_request_priorities;
```

### **Step 5: Manual Request Verification**
Check if your requests actually exist:

```sql
-- See all requests (admin view)
SELECT 
    id, 
    title, 
    requester_id, 
    status, 
    created_at,
    CASE WHEN requester_id = auth.uid() THEN 'YOURS' ELSE 'OTHER' END as ownership
FROM it_requests 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔍 **Common Issues & Solutions**

### **Issue 1: No User Record**
**Symptoms**: Requests create but don't show up
**Solution**: Create user record
```sql
INSERT INTO users (email, auth_user_id, role, status, full_name) 
VALUES (
    '[your-email]',
    auth.uid(),
    'admin', -- or 'employee'
    'active',
    '[Your Name]'
) ON CONFLICT (auth_user_id) DO NOTHING;
```

### **Issue 2: Empty Categories/Priorities**
**Symptoms**: Form dropdowns are empty
**Solution**: The fix script creates sample data automatically

### **Issue 3: RLS Policy Conflicts**
**Symptoms**: Inconsistent access to data
**Solution**: The fix script drops and recreates all policies

### **Issue 4: API Fallback Failures**
**Symptoms**: "Failed to fetch data" errors
**Solution**: Using simplified API (already implemented)

## 🎯 **What the Fix Does**

### **Database Fixes:**
1. **Creates missing user record** if needed
2. **Drops conflicting RLS policies**
3. **Creates working RLS policies**
4. **Adds sample categories and priorities** if missing
5. **Creates helpful database view**
6. **Tests everything automatically**

### **Code Fixes:**
1. **Simplified API calls** - no complex fallbacks
2. **Better error handling** - detailed console logging
3. **Improved data validation** - always returns arrays
4. **Enhanced debugging** - console logs for troubleshooting

## 🧪 **Testing Steps**

### **After Running the Fix:**

1. **Refresh Browser** - Clear cache and reload
2. **Open Console** - Check for error messages
3. **Navigate to IT Requests** - `/it-requests`
4. **Check Statistics** - Should show correct numbers
5. **Create Test Request** - Should work and appear immediately
6. **Check Request Inbox** - Should show your requests

### **Expected Results:**
- ✅ No "Failed to fetch data" errors
- ✅ Statistics cards show correct numbers
- ✅ Created requests appear immediately
- ✅ Categories and priorities load in dropdowns
- ✅ Filtering and search work properly
- ✅ Request Inbox shows your requests

## 🔧 **Manual Verification Steps**

### **1. Check Authentication**
```javascript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### **2. Test Database Access**
```javascript
// In browser console
const { data, error } = await supabase.from('it_requests').select('*');
console.log('Requests:', data, 'Error:', error);
```

### **3. Test Categories**
```javascript
// In browser console
const { data, error } = await supabase.from('it_request_categories').select('*');
console.log('Categories:', data, 'Error:', error);
```

## 📋 **Success Checklist**

After running the fix, verify:

- [ ] No console errors when loading IT Requests page
- [ ] Statistics cards show numbers > 0
- [ ] Categories dropdown has options
- [ ] Priorities dropdown has options  
- [ ] Can create new requests successfully
- [ ] Created requests appear in the list immediately
- [ ] Can edit existing requests
- [ ] Can filter and search requests
- [ ] Request Inbox shows requests

## 🚨 **If Fix Still Doesn't Work**

### **Emergency Manual Fix:**
1. **Create user record manually**:
```sql
INSERT INTO users (email, auth_user_id, role, status) 
VALUES ('your-email@domain.com', auth.uid(), 'admin', 'active');
```

2. **Disable RLS temporarily** (NOT recommended for production):
```sql
ALTER TABLE it_requests DISABLE ROW LEVEL SECURITY;
```

3. **Check for data**:
```sql
SELECT * FROM it_requests ORDER BY created_at DESC LIMIT 5;
```

4. **Re-enable RLS**:
```sql
ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
```

## 📞 **Support Information**

### **Files to Run:**
1. `fix_it_requests_data_fetching.sql` - Complete database fix
2. `setup_it_requests_complete.sql` - Full system setup (if needed)

### **Code Changes:**
- Using `itServicesApiFixed.js` - Simplified API
- Enhanced error logging in component
- Better data validation

### **Debug Commands:**
```sql
-- See your user record
SELECT * FROM users WHERE auth_user_id = auth.uid();

-- See your requests  
SELECT * FROM it_requests WHERE requester_id = auth.uid();

-- Test RLS policies
SELECT COUNT(*) FROM it_requests; -- Should work
```

**Run the `fix_it_requests_data_fetching.sql` script and the issues will be resolved!** 🎉

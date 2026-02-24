# Complaints Access Control Update

## 🎯 **Overview**
This document outlines the changes made to implement the new access control system for complaints where **only Admin users can see all complaints**, while all other users (including HR Managers) can only see their own complaints.

## ✅ **What Has Been Changed**

### **1. Frontend API Service (`src/services/complaintsApi.js`)**

#### **Updated Methods:**
- **`getComplaints(userId, userRole)`** - Now restricts non-admin users to their own complaints
- **`getComplaintsWithFilters(filters, userId, userRole)`** - Same restriction applied
- **`getComplaintStats(userId, userRole)`** - Same restriction applied

#### **Method Renames:**
- **`getAllComplaintsForHR()`** → **`getAllComplaintsForAdmin()`**
- **`getAllComplaintsWithFilters()`** → **`getAllComplaintsWithFiltersForAdmin()`**

#### **New Access Control Logic:**
```javascript
// OLD: Only employees were restricted
if (userRole === 'employee') {
  query = query.eq('complainant_id', userId);
}

// NEW: Only admins can see all complaints
if (userRole === 'admin') {
  // Admins can see all complaints - no filtering needed
} else {
  // All other roles (including HR managers, CS managers, etc.) can only see their own complaints
  query = query.eq('complainant_id', userId);
}
```

### **2. Database RLS Policies (`update_complaints_rls_admin_only.sql`)**

#### **New Function:**
- **`is_admin_only()`** - Returns `true` only for users with `admin` role

#### **Updated Policies:**
- **Policy 1**: Users can view their own complaints
- **Policy 2**: **ONLY** Admin users can view ALL complaints
- **Policy 3**: Users can create their own complaints
- **Policy 4**: Users can update their own open complaints
- **Policy 5**: **ONLY** Admin users can update ALL complaints
- **Policy 6**: Users can delete their own open complaints
- **Policy 7**: **ONLY** Admin users can delete ALL complaints

## 🔒 **New Access Control Matrix**

| User Role | Can See | Can Manage | Notes |
|-----------|---------|------------|-------|
| **Admin** | ✅ All complaints | ✅ All complaints | Full access to everything |
| **HR Manager** | ❌ Only own complaints | ❌ Only own complaints | Cannot see other users' complaints |
| **CS Manager** | ❌ Only own complaints | ❌ Only own complaints | Cannot see other users' complaints |
| **Employee** | ❌ Only own complaints | ❌ Only own complaints | Cannot see other users' complaints |
| **Viewer** | ❌ Only own complaints | ❌ Only own complaints | Cannot see other users' complaints |

## 🚀 **What This Means for Users**

### **For Admin Users:**
- ✅ Can see ALL complaints from all users
- ✅ Can manage ALL complaints (update status, priority, assign departments)
- ✅ Can delete any complaint
- ✅ Full system overview and control

### **For HR Managers (like Nagma):**
- ❌ **CANNOT** see complaints from other users in the main Complaints section
- ✅ Can still see all complaints in the **Complaints Inbox** (separate feature)
- ✅ Can only see and manage their own complaints
- ✅ Can still create new complaints

### **For All Other Users:**
- ❌ **CANNOT** see complaints from other users
- ✅ Can only see their own complaints
- ✅ Can create, update, and delete their own complaints
- ✅ Cannot access other users' data

## 🔧 **Implementation Steps**

### **Step 1: Update Frontend (Already Done)**
- ✅ Updated `complaintsApi.js` with new access control logic
- ✅ Renamed methods to reflect admin-only access

### **Step 2: Update Database (To Be Done)**
- ⏳ Run the SQL script: `update_complaints_rls_admin_only.sql`
- ⏳ This will update the RLS policies in your Supabase database

### **Step 3: Test the Changes**
- ⏳ Test with Admin user (should see all complaints)
- ⏳ Test with HR Manager user (should only see own complaints)
- ⏳ Test with regular employee (should only see own complaints)

## 📋 **Files Modified**

1. **`src/services/complaintsApi.js`** - Updated access control logic
2. **`update_complaints_rls_admin_only.sql`** - New database policies
3. **`COMPLAINTS_ACCESS_CONTROL_UPDATE.md`** - This documentation

## 🎯 **Key Benefits**

1. **Enhanced Privacy**: Users can only see their own complaints
2. **Admin Control**: Admins maintain full system oversight
3. **Role Clarity**: Clear separation between admin and user permissions
4. **Security**: Prevents unauthorized access to other users' complaints
5. **Compliance**: Better data protection and privacy

## ⚠️ **Important Notes**

1. **Complaints Inbox Unchanged**: The Complaints Inbox feature (where HR managers manage complaints) remains unchanged and will continue to work as expected.

2. **Database Update Required**: You must run the SQL script to update the RLS policies for the changes to take effect.

3. **Existing Complaints**: All existing complaints remain intact; only the access control has changed.

4. **User Experience**: Users will now see a cleaner, more focused view showing only their own complaints.

## 🔍 **Testing Checklist**

- [ ] Admin user can see all complaints
- [ ] HR Manager can only see their own complaints
- [ ] CS Manager can only see their own complaints
- [ ] Employee can only see their own complaints
- [ ] Users can still create new complaints
- [ ] Users can still edit their own complaints
- [ ] Complaints Inbox still works for HR managers
- [ ] No errors in console or database

## 📞 **Support**

If you encounter any issues after implementing these changes, please check:
1. Database RLS policies are correctly updated
2. User roles are properly set in the `users` table
3. Frontend is using the updated API methods
4. No caching issues in the browser

# Complaints Dual Access System

## 🎯 **Overview**
This document explains the **dual access system** for complaints that provides different access levels for different sections while maintaining proper security and privacy.

## 🔐 **Dual Access System Explained**

### **1. Main Complaints Section** 📝
**Purpose**: Where users raise and manage their own complaints

**Access Control**:
- **ALL users** (regardless of role) can **ONLY** see their own complaints
- This includes: Admin, HR Manager, CS Manager, Employee, Driver Management, etc.
- Users **CANNOT** see complaints from other users
- Users can create, edit, and delete their own complaints

**Why This Design**:
- Maintains user privacy
- Prevents unauthorized access to other users' complaints
- Creates a focused, personal view for each user

### **2. Complaints Inbox Section** 📥
**Purpose**: Where HR Managers and Admins manage and oversee all complaints

**Access Control**:
- **ONLY** Admin and HR Manager roles can access this section
- They can see **ALL complaints** from all users
- They can manage (update status, assign departments, delete) all complaints
- Provides the oversight needed for complaint management

**Why This Design**:
- Enables proper complaint management and oversight
- Allows HR Managers to handle complaints appropriately
- Maintains administrative control while respecting user privacy

## 🔒 **Access Control Matrix**

| User Role | Main Complaints | Complaints Inbox | What They Can See |
|-----------|-----------------|------------------|-------------------|
| **Admin** | ✅ Own only | ✅ All complaints | All complaints |
| **HR Manager** | ✅ Own only | ✅ All complaints | All complaints |
| **CS Manager** | ✅ Own only | ❌ No access | Own complaints only |
| **Driver Management** | ✅ Own only | ❌ No access | Own complaints only |
| **Employee** | ✅ Own only | ❌ No access | Own complaints only |
| **Manager** | ✅ Own only | ❌ No access | Own complaints only |
| **Viewer** | ✅ Own only | ❌ No access | Own complaints only |

## 🚀 **User Experience by Role**

### **For Admin Users:**
- **Main Complaints**: See only their own complaints (personal view)
- **Complaints Inbox**: See and manage ALL complaints (oversight view)
- **Full Control**: Can manage the entire complaint system

### **For HR Managers (like Nagma):**
- **Main Complaints**: See only their own complaints (personal view)
- **Complaints Inbox**: See and manage ALL complaints (oversight view)
- **Management**: Can handle complaints appropriately

### **For All Other Users:**
- **Main Complaints**: See only their own complaints (personal view)
- **Complaints Inbox**: ❌ **No access** (hidden/not visible)
- **Privacy**: Cannot see complaints from other users

## 🔧 **Technical Implementation**

### **Frontend Changes:**
1. **`src/services/complaintsApi.js`**:
   - `getComplaintsWithFilters()` - Restricted to own complaints for all users
   - `getAllComplaintsForInbox()` - New method for HR/Admin inbox access
   - `getComplaintsByCategories()` - For concerns view in inbox

2. **`src/pages/ComplaintsInbox.jsx`**:
   - Uses `getAllComplaintsForInbox()` for HR/Admin access
   - Maintains existing functionality for complaint management

### **Database Changes:**
1. **RLS Policies**:
   - Policy 1: Users can view own complaints (main section)
   - Policy 2: Admin/HR can view all complaints (inbox access)
   - Policies 3-7: Similar dual access for create/update/delete

2. **Function**: `is_admin_or_hr_manager()` - Checks user role for inbox access

## 📋 **Files Modified**

1. **`src/services/complaintsApi.js`** - Added inbox-specific methods
2. **`src/pages/ComplaintsInbox.jsx`** - Updated to use correct API methods
3. **`fix_complaints_dual_access_system.sql`** - Database RLS policies
4. **`COMPLAINTS_DUAL_ACCESS_SYSTEM.md`** - This documentation

## 🎯 **Key Benefits**

1. **Privacy Protection**: Users can only see their own complaints
2. **Management Oversight**: HR Managers and Admins can manage all complaints
3. **Clear Separation**: Different sections serve different purposes
4. **Security**: Prevents unauthorized access to sensitive information
5. **User Experience**: Focused, relevant views for each user type

## ⚠️ **Important Notes**

1. **Main Complaints Section**: All users see only their own complaints
2. **Complaints Inbox**: Only HR Managers and Admins can access
3. **Role-Based Access**: Access is determined by user role in the system
4. **No Data Loss**: All existing complaints remain intact
5. **Backward Compatibility**: Existing functionality is preserved

## 🔍 **Testing Checklist**

### **Main Complaints Section:**
- [ ] Admin sees only own complaints
- [ ] HR Manager sees only own complaints
- [ ] CS Manager sees only own complaints
- [ ] Employee sees only own complaints
- [ ] Users can create new complaints
- [ ] Users can edit own complaints
- [ ] Users can delete own complaints

### **Complaints Inbox:**
- [ ] Admin can see all complaints
- [ ] HR Manager can see all complaints
- [ ] CS Manager cannot access inbox
- [ ] Employee cannot access inbox
- [ ] Inbox shows all complaints correctly
- [ ] Status updates work properly
- [ ] Filtering and search work

### **General:**
- [ ] No console errors
- [ ] No database permission errors
- [ ] Role-based navigation works correctly
- [ ] Complaints Inbox only visible to HR/Admin

## 🚨 **Troubleshooting**

### **If HR Managers Can't See All Complaints in Inbox:**
1. Check if `fix_complaints_dual_access_system.sql` was run
2. Verify user role is set to `hr_manager` in database
3. Check RLS policies are active
4. Clear browser cache and reload

### **If Users Can See Other Users' Complaints:**
1. Verify RLS is enabled on complaints table
2. Check that policies are correctly applied
3. Ensure frontend is using correct API methods

### **If Complaints Inbox is Not Visible:**
1. Check user role in database
2. Verify role-based navigation is working
3. Check if user has proper permissions

## 📞 **Support**

For any issues with the dual access system:
1. Verify database RLS policies are correctly set
2. Check user roles in the `users` table
3. Ensure frontend is using updated API methods
4. Clear browser cache and test again

## 🔄 **Migration Steps**

1. **✅ Frontend Updated** - API methods and components updated
2. **⏳ Database Update** - Run `fix_complaints_dual_access_system.sql`
3. **⏳ Testing** - Verify both sections work correctly
4. **⏳ User Training** - Explain the new access system to users

---

**This dual access system ensures that users maintain privacy in the main complaints section while HR Managers and Admins have the oversight needed to manage complaints effectively through the dedicated inbox.**

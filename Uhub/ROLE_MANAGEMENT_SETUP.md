# Role Management System Setup Guide

## 🎯 **Overview**

This guide will help you set up the role management system to resolve the RLS policy violations and enable proper access control for the Driver Management System.

## 🚨 **Current Issue**

You're experiencing this error:
```
Failed to save driver: new row violates row-level security policy for table "drivers"
```

**Root Cause**: The current user doesn't have sufficient permissions (admin/manager role) to insert driver records.

## 🔧 **Solution Steps**

### **Step 1: Quick Fix (Immediate Solution)**

Run the `quick_admin_setup.sql` script in your Supabase SQL editor:

```sql
-- This will assign admin role to the first user
UPDATE employees 
SET role = 'admin' 
WHERE id = (SELECT id FROM employees ORDER BY created_at ASC LIMIT 1);
```

### **Step 2: Comprehensive Role Management (Recommended)**

For a full-featured role management system, run the `setup_role_management.sql` script.

### **Step 3: Verify the Fix**

After running either script, check if the role was assigned:

```sql
SELECT id, email, full_name, role FROM employees WHERE role = 'admin';
```

## 🏗️ **System Architecture**

### **Role Hierarchy**

1. **Admin** - Full system access
   - Create/Edit/Delete drivers
   - User management
   - System settings
   - All operations

2. **Manager** - Department management
   - Create/Edit drivers
   - View all data
   - Team management
   - No user management

3. **Employee** - Standard access
   - View drivers
   - Basic operations
   - Personal data access

4. **Viewer** - Read-only access
   - View only
   - No modifications
   - Limited access

### **Permissions Matrix**

| Operation | Admin | Manager | Employee | Viewer |
|-----------|-------|---------|----------|---------|
| View Drivers | ✅ | ✅ | ✅ | ✅ |
| Create Drivers | ✅ | ✅ | ❌ | ❌ |
| Edit Drivers | ✅ | ✅ | ❌ | ❌ |
| Delete Drivers | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ | ❌ |

## 🎮 **How to Use**

### **Accessing User Management**

1. **Via Sidebar**: Click "User Management" in the admin section (requires admin role)
2. **Direct URL**: Navigate to `/admin/users` or `/user-management`

### **Managing User Roles**

1. Navigate to User Management
2. Click the edit button on any user
3. Select the appropriate role
4. Save changes

### **Role Manager Component**

The new `RoleManager` component provides:
- Visual role selection
- Permission explanations
- Role change capabilities
- Admin warnings

## 🔒 **Security Features**

### **Row Level Security (RLS)**

- **Drivers Table**: Role-based access control
- **Driver Documents**: Secure document access
- **Employees Table**: Protected user data

### **Policy Enforcement**

- Automatic permission checking
- Role-based operation restrictions
- Secure data access patterns

## 🧪 **Testing the System**

### **Test Driver Creation**

1. Ensure you have admin/manager role
2. Navigate to `/drivers`
3. Click "Add Driver"
4. Fill in driver details
5. Save - should work without RLS errors

### **Test Role Changes**

1. Use User Management to change a user's role
2. Test different permission levels
3. Verify access restrictions work

## 🚀 **Advanced Features**

### **Custom Permissions**

The system supports JSON-based permissions:

```json
{
  "drivers": ["create", "read", "update", "delete"],
  "employees": ["read", "update"],
  "user_management": true
}
```

### **Role Inheritance**

- Manager inherits employee permissions
- Admin inherits all permissions
- Custom role combinations possible

## 🐛 **Troubleshooting**

### **Common Issues**

1. **RLS Still Blocking**:
   - Check user role in employees table
   - Verify RLS policies are updated
   - Clear browser cache and relogin

2. **Role Not Updating**:
   - Check database permissions
   - Verify user ID matches
   - Check for constraint violations

3. **Access Denied**:
   - Confirm user has required role
   - Check RLS policy syntax
   - Verify table relationships

### **Debug Commands**

```sql
-- Check current user role
SELECT role FROM employees WHERE id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'drivers';

-- Test permissions function
SELECT get_user_permissions(auth.uid());
```

## 📋 **Next Steps**

1. **Run the setup scripts** in Supabase SQL editor
2. **Test driver creation** to verify RLS is working
3. **Explore User Management** to manage roles
4. **Customize permissions** as needed for your organization

## 🎉 **Success Indicators**

- ✅ Driver creation works without RLS errors
- ✅ User Management accessible via sidebar
- ✅ Role changes take effect immediately
- ✅ Proper access control enforced
- ✅ No more permission-related errors

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section
2. Verify SQL script execution
3. Check browser console for errors
4. Ensure Supabase connection is working

---

**Note**: This system provides enterprise-grade access control while maintaining ease of use. The role-based approach ensures security without compromising functionality.

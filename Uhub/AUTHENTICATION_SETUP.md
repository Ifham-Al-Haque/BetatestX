# 🔐 Authentication & Role-Based Access Setup Guide

## **Overview**
This guide will help you set up the complete authentication and role-based access control system for your Uhub application.

## **🚀 Quick Setup Steps**

### **Step 1: Database Setup**
Run these SQL scripts in your Supabase SQL editor in order:

1. **Create Tables**: `create_missing_tables.sql`
2. **Setup Admin User**: `setup_admin_user.sql`
3. **Verify Setup**: `check_database_setup.sql`

### **Step 2: Test the System**
1. Start your React app: `npm start`
2. You should be redirected to `/login`
3. Login with `ifham@udrive.ae` (admin account)
4. You should see the dashboard with admin features

## **🔑 Authentication Flow**

### **Initial Access**
- **No Session**: Redirects to `/login`
- **Valid Session**: Redirects to `/` (Dashboard)
- **Admin Session**: Full access to all features

### **Role-Based Access**

#### **👑 Admin Role (`admin`)**
- **Full Access**: All features and pages
- **Admin Features**:
  - User Management
  - Access Management
  - Access Requests
  - System Analytics
  - All employee features

#### **👔 Manager Role (`manager`)**
- **Department Management**: Manage team members
- **Asset Management**: Assign and track assets
- **Expense Approval**: Approve team expenses
- **Reports**: View department reports

#### **👤 Employee Role (`employee`)**
- **Personal Profile**: View and edit own profile
- **Attendance**: Mark attendance
- **Expenses**: Submit expense reports
- **Tickets**: Create and track support tickets

#### **👁️ Viewer Role (`viewer`)**
- **Read-Only Access**: View data only
- **No Edit Permissions**: Cannot modify any data

## **🛡️ Security Features**

### **Route Protection**
- **ProtectedRoute**: Requires authentication
- **AdminRoute**: Requires admin role
- **Role-Based Sections**: Conditional rendering based on role

### **Database Security**
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Policies**: Different permissions per role
- **Session Management**: Secure session handling

## **📱 User Interface**

### **Login Page**
- Modern, professional design
- Role indicator for admin users
- Password visibility toggle
- Forgot password functionality

### **Sidebar Navigation**
- **Dynamic Menu**: Shows different options based on role
- **Admin Section**: Only visible to admin users
- **User Info**: Displays current user and role
- **Sign Out**: Secure logout functionality

### **Dashboard**
- **Role-Based Sections**: Different content based on role
- **Admin Dashboard**: Full analytics and management
- **Employee Dashboard**: Personal overview and tasks

## **🔧 Configuration**

### **Adding New Users**
1. **Admin Method**: Use User Management page
2. **Database Method**: Insert into `employees` table
3. **Auth Setup**: Create Supabase auth user

### **Role Assignment**
```sql
-- Example: Create a new manager
INSERT INTO employees (
    id,
    full_name,
    email,
    role,
    status,
    department,
    position
) VALUES (
    'auth-user-id-here',
    'John Manager',
    'john@udrive.ae',
    'manager',
    'active',
    'IT',
    'IT Manager'
);
```

### **Customizing Roles**
1. **Add New Role**: Update the roles array in components
2. **Set Permissions**: Modify RLS policies
3. **Update UI**: Add role-specific components

## **🚨 Troubleshooting**

### **Common Issues**

#### **"User not found" Error**
- Check if user exists in `employees` table
- Verify the user ID matches auth user ID
- Run the admin setup script

#### **"Access Denied" Error**
- Check user role in database
- Verify RLS policies are correct
- Ensure user has required permissions

#### **Login Loop**
- Clear browser cache and cookies
- Check authentication state in Supabase
- Verify redirect logic in App.js

#### **Missing Admin Features**
- Ensure user role is exactly "admin" (lowercase)
- Check AdminRoute component logic
- Verify role is loaded from AuthContext

### **Debug Commands**
```sql
-- Check user roles
SELECT id, email, role, status FROM employees;

-- Check auth users
SELECT id, email FROM auth.users;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'employees';
```

## **📊 Testing Checklist**

### **Authentication Testing**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Session persistence
- [ ] Password reset

### **Role Testing**
- [ ] Admin access to all features
- [ ] Manager access to department features
- [ ] Employee access to personal features
- [ ] Viewer read-only access
- [ ] Unauthorized access blocked

### **Navigation Testing**
- [ ] Sidebar shows correct menu items
- [ ] Admin section visible only to admin
- [ ] Role-based redirects work
- [ ] Protected routes block unauthorized access

## **🔮 Future Enhancements**

### **Planned Features**
- **Multi-Factor Authentication (MFA)**
- **Session Timeout Management**
- **Audit Logging**
- **Bulk User Import**
- **Advanced Role Permissions**

### **Integration Options**
- **SSO Integration**: Connect with company SSO
- **LDAP Integration**: Sync with Active Directory
- **API Access**: REST API for external systems

## **📞 Support**

If you encounter any issues:
1. Check the troubleshooting section
2. Verify database setup
3. Check browser console for errors
4. Review Supabase logs

---

**🎉 Congratulations!** Your authentication system is now fully functional with role-based access control. 
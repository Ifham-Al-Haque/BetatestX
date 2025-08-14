# User Invitation System Setup Guide

## 🎯 **Overview**

This guide will help you set up a comprehensive invitation-based user registration system where:
- **Admins** can invite users with specific roles
- **Users** receive invitation links via email
- **Users** set up their own passwords and complete profiles
- **Role-based access control** is automatically enforced

## 🚀 **Features**

### **Admin Capabilities**
- Send invitations with role assignment
- Manage pending invitations
- Resend expired invitations
- Cancel invitations
- Copy invitation links

### **User Experience**
- Click invitation link
- Set up personal information
- Create secure password
- Automatic account creation
- Immediate access to assigned role

### **Security Features**
- Secure invitation tokens
- 7-day expiration
- Role-based permissions
- Password validation
- RLS policy enforcement

## 🔧 **Setup Steps**

### **Step 1: Database Setup**

Run the `setup_invitation_system.sql` script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of setup_invitation_system.sql
-- This will create all necessary tables, functions, and policies
```

### **Step 2: Frontend Integration**

The following components have been created:
- `InvitationManager.jsx` - Admin interface for managing invitations
- `InvitationAccept.jsx` - User interface for accepting invitations
- Route added to `App.js` for `/invite/:token`

### **Step 3: Add to User Management**

Integrate the `InvitationManager` component into your UserManagement page:

```jsx
import InvitationManager from '../components/InvitationManager';

// Add this to your UserManagement component
<InvitationManager />
```

## 📧 **How to Use**

### **For Admins (ifham@udrive.ae)**

1. **Navigate to User Management**
   - Go to `/admin/users` or `/user-management`
   - Look for the "User Invitations" section

2. **Send Invitation**
   - Click "Send Invitation"
   - Enter user's email address
   - Select appropriate role
   - Add department and position (optional)
   - Click "Send Invitation"

3. **Manage Invitations**
   - View all pending invitations
   - Copy invitation links
   - Resend expired invitations
   - Cancel unwanted invitations

### **For Invited Users**

1. **Receive Invitation**
   - User receives invitation email
   - Clicks invitation link
   - Link format: `https://yourapp.com/invite/TOKEN`

2. **Set Up Account**
   - Enter full name (required)
   - Add phone and location (optional)
   - Create password (min 8 characters)
   - Confirm password
   - Click "Create Account"

3. **Access System**
   - Account is automatically created
   - User can immediately log in
   - Role-based permissions are active

## 🏗️ **System Architecture**

### **Database Tables**

1. **`invitations`** - Stores invitation details
   - Email, role, token, status, expiry
   - Inviter information
   - Acceptance tracking

2. **`invitation_roles`** - Available roles for invitations
   - Role definitions and permissions
   - Display names and descriptions

3. **`roles`** - Main role system
   - Permissions and access levels
   - RLS policy enforcement

### **Key Functions**

1. **`send_invitation()`** - Creates new invitation
2. **`accept_invitation()`** - Processes invitation acceptance
3. **`get_pending_invitations()`** - Lists pending invites
4. **`cancel_invitation()`** - Cancels invitation
5. **`resend_invitation()`** - Resends with new token

### **Security Features**

- **Row Level Security (RLS)** on all tables
- **Admin-only** invitation management
- **Secure token generation** (32-byte random)
- **Automatic expiration** (7 days)
- **Role-based access control**

## 🎨 **Customization Options**

### **Modify Available Roles**

Edit the `invitation_roles` table to add/remove roles:

```sql
INSERT INTO invitation_roles (role_name, display_name, description) VALUES
    ('custom_role', 'Custom Role', 'Description of custom role');
```

### **Change Expiration Time**

Modify the default expiration in the `invitations` table:

```sql
ALTER TABLE invitations 
ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '14 days');
```

### **Add Custom Fields**

Extend the invitation form by adding fields to the `invitations` table:

```sql
ALTER TABLE invitations ADD COLUMN custom_field VARCHAR(255);
```

## 🧪 **Testing the System**

### **Test Invitation Flow**

1. **Send Test Invitation**
   - Use your admin account
   - Send invitation to test email
   - Verify invitation appears in list

2. **Test Acceptance**
   - Copy invitation link
   - Open in incognito browser
   - Complete account setup
   - Verify account creation

3. **Test Role Enforcement**
   - Log in with new account
   - Verify role-based access
   - Test permission restrictions

### **Common Test Scenarios**

- **Valid invitation** - Should work normally
- **Expired invitation** - Should show error
- **Invalid token** - Should redirect to login
- **Duplicate email** - Should show error
- **Role permissions** - Should enforce correctly

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Invitation not sending**
   - Check admin permissions
   - Verify email format
   - Check database functions

2. **User can't accept invitation**
   - Verify token validity
   - Check expiration date
   - Ensure invitation status is 'pending'

3. **Role not working after acceptance**
   - Check role assignment in employees table
   - Verify RLS policies
   - Check role_id mapping

### **Debug Commands**

```sql
-- Check invitation status
SELECT * FROM invitations WHERE email = 'user@example.com';

-- Verify user creation
SELECT * FROM employees WHERE email = 'user@example.com';

-- Check role assignment
SELECT e.*, r.name as role_name 
FROM employees e 
JOIN roles r ON e.role_id = r.id 
WHERE e.email = 'user@example.com';

-- Test permissions function
SELECT check_user_access(auth.uid(), 'drivers', 'create');
```

## 📋 **Next Steps**

### **Immediate Actions**

1. **Run the setup script** in Supabase
2. **Test invitation system** with your account
3. **Send first invitation** to a test user
4. **Verify complete flow** works end-to-end

### **Future Enhancements**

1. **Email Integration** - Send actual emails
2. **Bulk Invitations** - Invite multiple users
3. **Template Customization** - Branded invitation emails
4. **Analytics** - Track invitation success rates
5. **Advanced Roles** - Custom permission sets

## 🎉 **Success Indicators**

- ✅ Invitation system accessible to admins
- ✅ Invitations can be sent successfully
- ✅ Users can accept invitations
- ✅ Accounts are created with correct roles
- ✅ Role-based access control works
- ✅ No permission errors in logs

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section
2. Verify SQL script execution
3. Check browser console for errors
4. Ensure Supabase connection is working
5. Verify admin permissions are set correctly

---

**Note**: This system provides enterprise-grade user onboarding with security and flexibility. The invitation-based approach ensures controlled access while maintaining user autonomy.

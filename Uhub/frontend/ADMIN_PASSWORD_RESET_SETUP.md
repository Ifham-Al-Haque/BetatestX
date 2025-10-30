# Admin Password Reset System - Setup Guide

## Overview
This system allows ONLY authorized admin users (`ifham@udrive.ae`) to reset passwords for other users in the Uhub application. The system is secured with role-based access control and logging.

## Security Features
- ✅ **Accessible Only by:** `ifham@udrive.ae`
- ✅ **Password Reset Logging:** All attempts are logged
- ✅ **Authorization Verification:** Admin identity verified before operations
- ✅ **Secure Password Hashing:** Uses Supabase Auth (bcrypt)

## Setup Steps

### Step 1: Run SQL Script
Run the `admin_password_reset_system.sql` file in your Supabase SQL Editor:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `admin_password_reset_system.sql`
5. Click "Run" to execute

This will create:
- `verify_admin_password_reset_permission()` function
- `admin_generate_password_reset_link()` function
- `log_password_reset_attempt()` function
- `password_reset_logs` table

### Step 2: Add Component to UserManagement Page
The `AdminPasswordReset` component has been created in `src/components/AdminPasswordReset.jsx`.

To add it to your UserManagement page, import and render it:

```jsx
// Add at the top of UserManagement.jsx
import AdminPasswordReset from '../components/AdminPasswordReset';

// Then add as a tab or section in your JSX
<AdminPasswordReset />
```

### Step 3: Update UserManagement to Include Password Reset Tab
You can add a tabbed interface to the UserManagement page:

```jsx
// In UserManagement.jsx, add state for tabs
const [activeTab, setActiveTab] = useState('users'); // 'users' or 'password-reset'

// In your JSX
<div className="space-y-6">
  {/* Tab Navigation */}
  <div className="flex gap-4 border-b">
    <button 
      onClick={() => setActiveTab('users')}
      className={activeTab === 'users' ? 'border-b-2 border-blue-600' : ''}
    >
      Users
    </button>
    <button 
      onClick={() => setActiveTab('password-reset')}
      className={activeTab === 'password-reset' ? 'border-b-2 border-blue-600' : ''}
    >
      Password Reset
    </button>
  </div>

  {/* Tab Content */}
  {activeTab === 'users' && (
    // Your existing user management UI
  )}
  
  {activeTab === 'password-reset' && (
    <AdminPasswordReset />
  )}
</div>
```

## How to Use

### For Admin User (ifham@udrive.ae):

1. **Navigate to UserManagement page**
2. **Go to "Password Reset" tab**
3. **Search for the user** by entering their email address
4. **Click "Search"** to find the user
5. **Select the user** from search results
6. **Enter new password** and confirm it
7. **Click "Reset Password"**

### Important Notes:

⚠️ **IMPORTANT:** Due to Supabase security, passwords cannot be directly updated via SQL. The system will provide instructions:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the target user
3. Click "Reset Password" button
4. User will receive an email with reset link

Alternatively, if you need to set the password immediately, you'll need to:
- Use Supabase Admin API with service role key
- Or manually reset through Supabase Dashboard

## Testing

### Test Password Reset for nagma@udrive.ae:

1. Login as `ifham@udrive.ae`
2. Go to UserManagement → Password Reset
3. Search for `nagma@udrive.ae`
4. Follow the instructions to reset password to `Udrive@123`

### Verify in Supabase:

```sql
-- Check if log was created
SELECT * FROM password_reset_logs 
WHERE target_user_email = 'nagma@udrive.ae'
ORDER BY created_at DESC;

-- Check user exists
SELECT id, email, role 
FROM users 
WHERE email = 'nagma@udrive.ae';
```

## Security

### Why Direct SQL Password Updates Aren't Allowed:
Supabase uses bcrypt encryption for passwords with this format:
```
$2a$10$BOcGO5ki.Z6ab.cwM3cZCuVWZVOYvfZKezV4UwE.Y0iVftR9A4Lg2
```

- `$2a$10$` = bcrypt version and rounds
- The hash is one-way encrypted for security
- Cannot be reversed or modified directly

### Secure Methods to Reset Passwords:
1. **Supabase Dashboard** (Recommended)
   - Authentication → Users → Reset Password
   - User receives email with reset link

2. **Supabase Admin API** (For automation)
   - Requires service role key
   - Should be done from backend API

3. **Magic Link** (User self-service)
   - Send magic link via Auth API
   - User clicks link to set new password

## Troubleshooting

### "User not found" error:
- Check if user exists in `auth.users` table
- Verify email is correct
- Check if user has confirmed email

### "Unauthorized access" error:
- Current user must be `ifham@udrive.ae`
- Check role in database is `admin`

### "Passwords do not match":
- Ensure both password fields are identical
- Check for extra spaces or characters

## Logs

All password reset attempts are logged in the `password_reset_logs` table:

```sql
-- View all password reset attempts
SELECT 
    admin_email,
    target_user_email,
    reset_status,
    error_message,
    created_at
FROM password_reset_logs
ORDER BY created_at DESC;
```

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review authentication guides
- Contact system administrator


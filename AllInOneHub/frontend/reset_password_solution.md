# Fix Login Issue for nagma@udrive.ae and hr@udrive.ae

## Problem
400 error when trying to login - likely caused by unconfirmed emails or incorrect passwords.

## Solution Steps

### Step 1: Confirm Email Addresses
Run `fix_email_confirmation.sql` in Supabase SQL Editor to confirm the emails.

### Step 2: Reset Passwords via Supabase Dashboard
1. Open **Supabase Dashboard**
2. Go to **Authentication → Users**
3. Find `nagma@udrive.ae`
4. Click on the user
5. Click **"Send Password Reset Email"** or **"Reset Password"**
6. Repeat for `hr@udrive.ae`
7. Users will receive reset emails with instructions

### Step 3: Alternative - Direct Password Update
If you need immediate access:

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click on the user (`nagma@udrive.ae` or `hr@udrive.ae`)
3. Click **"Reset Password"**
4. Enter a new temporary password
5. Save the password
6. Share the password securely with the user

### Step 4: Test Login
After completing the above steps:
- Email: `nagma@udrive.ae`
- Password: (the temporary password you set or the one from reset email)
- Click "Login"

## What to Check If Still Not Working

1. **Email Confirmation**: Make sure `email_confirmed_at` is not NULL
2. **Password**: Make sure user has a valid encrypted password
3. **User Status**: Check that user status is 'active' in the users table
4. **Network**: Clear browser cache and try again

## Quick Fix Commands

### Check Status
```sql
-- Run check_password_and_confirmation.sql to see current status
```

### Confirm Emails
```sql
-- Run fix_email_confirmation.sql to confirm emails immediately
```

### Manual Password Reset (if dashboard method doesn't work)
Go to Supabase Dashboard → Authentication → Users → [Select User] → Reset Password

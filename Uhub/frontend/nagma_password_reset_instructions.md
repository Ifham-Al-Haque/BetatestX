# Reset Password for nagma@udrive.ae

## Current User Details
- **ID**: `08db78d3-c942-47c2-a741-10fd07e03baf`
- **Email**: nagma@udrive.ae
- **Created**: 2025-08-26 13:45:43

## Method to Reset Password

### Option 1: Through Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Search for `nagma@udrive.ae`
4. Click on the user profile
5. Click **"Send Password Reset Email"** or **"Send Magic Link"**
6. The user will receive an email with a link to reset their password
7. The user can set the new password: `Udrive@123`

### Option 2: Using Supabase CLI (if installed)
```bash
# Send password reset email
supabase auth reset-password nagma@udrive.ae

# Or use magic link
supabase auth magic-link nagma@udrive.ae
```

### Option 3: Programmatic Reset (for admin use)
If you have admin access and need to automate this:

```javascript
// Using Supabase Admin API
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for admin operations
);

// Send password reset email
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: 'recovery',
  email: 'nagma@udrive.ae',
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Password reset link:', data);
}
```

### Option 4: Manual Database Update (NOT RECOMMENDED - Use as last resort)
**Warning**: This is not the recommended approach. Supabase uses bcrypt encryption and you cannot manually hash passwords in SQL.

If you absolutely must do this:
1. You need to generate a bcrypt hash of `Udrive@123`
2. This requires a programming language or bcrypt tool
3. Then update the database (very risky - not recommended)

Instead, use Option 1 or 2 above.

## Important Security Notes
- Passwords in Supabase are **hashed** using bcrypt (you can see the `$2a$10$...` hash)
- You **cannot** manually create this hash
- Supabase handles password encryption/decryption automatically
- The secure way is to use Supabase's built-in password reset system

## Quick Steps (5 minutes)
1. Login to Supabase Dashboard
2. Go to Authentication > Users
3. Find nagma@udrive.ae
4. Click "Send Password Reset Email"
5. User checks email and resets password to `Udrive@123`

## Verification Query
After reset, you can verify the user exists with:

```sql
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'nagma@udrive.ae';
```


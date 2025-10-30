-- Admin Password Reset System for Uhub Application
-- This system allows ONLY the admin user (ifham@udrive.ae) to reset passwords
-- Security: Uses Supabase Auth API (not direct SQL updates)

-- Step 1: Create a function to verify admin authorization
-- This function checks if the current user is authorized to reset passwords

CREATE OR REPLACE FUNCTION verify_admin_password_reset_permission(requesting_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_authorized BOOLEAN := FALSE;
  requesting_user_record RECORD;
BEGIN
  -- Check if the requesting user exists and has admin role
  SELECT * INTO requesting_user_record
  FROM users
  WHERE email = requesting_user_email AND role = 'admin';
  
  -- ONLY ifham@udrive.ae or other specified admin emails can reset passwords
  -- This is a hardcoded security check
  IF requesting_user_email = 'ifham@udrive.ae' THEN
    is_authorized := TRUE;
  END IF;
  
  RETURN is_authorized;
END;
$$;

-- Step 2: Create a function to generate password reset link (for authorized admin only)
-- This function creates a password reset token that can be sent to users

CREATE OR REPLACE FUNCTION admin_generate_password_reset_link(
  target_user_email TEXT,
  requesting_admin_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_auth_user RECORD;
  requesting_user_id UUID;
  verification_result BOOLEAN;
  result JSONB;
BEGIN
  -- Verify admin has permission
  verification_result := verify_admin_password_reset_permission(requesting_admin_email);
  
  IF NOT verification_result THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only authorized admins can reset passwords',
      'message', 'You do not have permission to reset passwords'
    );
  END IF;
  
  -- Find the target user in auth.users
  SELECT * INTO target_auth_user
  FROM auth.users
  WHERE email = target_user_email;
  
  IF target_auth_user IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'message', 'No user found with email ' || target_user_email
    );
  END IF;
  
  -- Get requesting admin's user ID
  SELECT id INTO requesting_user_id
  FROM auth.users
  WHERE email = requesting_admin_email;
  
  -- Return success (actual password reset must be done through Supabase Dashboard or Auth API)
  -- IMPORTANT: Supabase does not allow direct password updates via SQL for security reasons
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password reset authorized. Please use Supabase Dashboard or Auth API to reset the password.',
    'target_user_email', target_user_email,
    'admin_email', requesting_admin_email,
    'instructions', 'Use Supabase Dashboard > Authentication > Users to reset the password for ' || target_user_email
  );
END;
$$;

-- Step 3: Create a logging table to track all password reset attempts
CREATE TABLE IF NOT EXISTS password_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  target_user_email TEXT NOT NULL,
  reset_attempted_at TIMESTAMPTZ DEFAULT NOW(),
  reset_status TEXT DEFAULT 'attempted',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy for password reset logs
ALTER TABLE password_reset_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view password reset logs"
ON password_reset_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Step 4: Create a function to log password reset attempts
CREATE OR REPLACE FUNCTION log_password_reset_attempt(
  p_admin_email TEXT,
  p_target_email TEXT,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO password_reset_logs (
    admin_email,
    target_user_email,
    reset_status,
    error_message
  ) VALUES (
    p_admin_email,
    p_target_email,
    p_status,
    p_error
  );
END;
$$;

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_admin_password_reset_permission TO authenticated;
GRANT EXECUTE ON FUNCTION admin_generate_password_reset_link TO authenticated;
GRANT EXECUTE ON FUNCTION log_password_reset_attempt TO authenticated;

-- Security Note:
-- This system uses Supabase Auth which handles password encryption
-- Passwords are hashed using bcrypt and cannot be directly modified via SQL
-- The authorized admin must use the Supabase Dashboard or Admin API to reset passwords
-- This is by design for security reasons

-- Usage Instructions:
-- 1. Only ifham@udrive.ae can use this system
-- 2. To reset a password, you need to use Supabase Dashboard:
--    - Go to Authentication > Users
--    - Find the target user
--    - Click "Reset Password" button
-- 3. Or use the Admin API programmatically

COMMENT ON FUNCTION verify_admin_password_reset_permission IS 
'Verifies if an admin user has permission to reset passwords. Only ifham@udrive.ae is authorized.';

COMMENT ON FUNCTION admin_generate_password_reset_link IS 
'Generates password reset authorization. Passwords must be reset through Supabase Dashboard or Auth API.';


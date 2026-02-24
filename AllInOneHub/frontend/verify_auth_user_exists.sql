-- Database Function to Verify Auth User Exists
-- Run this in your Supabase SQL Editor to add user verification capability
-- This function checks if a user exists in auth.users table

CREATE OR REPLACE FUNCTION verify_auth_user_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  -- Note: This requires SECURITY DEFINER to access auth schema
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id
  ) INTO user_exists;
  
  RETURN user_exists;
EXCEPTION
  WHEN OTHERS THEN
    -- If we can't access auth.users, return NULL to indicate unknown
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_auth_user_exists(UUID) TO authenticated;

-- Optional: Create a function to find and report users with missing auth accounts
CREATE OR REPLACE FUNCTION find_users_without_auth_accounts()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  auth_user_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.auth_user_id,
    u.status
  FROM users u
  WHERE u.auth_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM auth.users au 
      WHERE au.id = u.auth_user_id
    )
    AND u.status = 'active';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_users_without_auth_accounts() TO authenticated;

-- Optional: Create a view to easily see users with missing auth accounts
CREATE OR REPLACE VIEW users_missing_auth_accounts AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.auth_user_id,
  u.status,
  u.department,
  u.position
FROM users u
WHERE u.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM auth.users au 
    WHERE au.id = u.auth_user_id
  )
  AND u.status = 'active';

-- Grant select permission
GRANT SELECT ON users_missing_auth_accounts TO authenticated;

COMMENT ON FUNCTION verify_auth_user_exists IS 'Verifies if a user ID exists in auth.users table. Returns true if exists, false if not, NULL if check cannot be performed.';
COMMENT ON FUNCTION find_users_without_auth_accounts IS 'Finds all active users in the users table that do not have corresponding entries in auth.users.';
COMMENT ON VIEW users_missing_auth_accounts IS 'View showing all active users that exist in users table but not in auth.users (data inconsistency).';


-- Fix Users Table Schema - Add Missing Columns
-- Run this in your Supabase SQL Editor to resolve the avatar_url error

-- First, check the current structure of the users table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Add missing columns that UserProfile component expects
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name TEXT;
    RAISE NOTICE 'full_name column added successfully';
  END IF;

  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'avatar_url column added successfully';
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
    RAISE NOTICE 'phone column added successfully';
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'location'
  ) THEN
    ALTER TABLE users ADD COLUMN location TEXT;
    RAISE NOTICE 'location column added successfully';
  END IF;

  -- Add bio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'bio'
  ) THEN
    ALTER TABLE users ADD COLUMN bio TEXT;
    RAISE NOTICE 'bio column added successfully';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'updated_at column added successfully';
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'created_at column added successfully';
  END IF;

  -- Add auth_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_user_id UUID;
    RAISE NOTICE 'auth_user_id column added successfully';
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
    RAISE NOTICE 'status column added successfully';
  END IF;

  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'employee';
    RAISE NOTICE 'role column added successfully';
  END IF;

  -- Add department column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'department'
  ) THEN
    ALTER TABLE users ADD COLUMN department TEXT DEFAULT 'Unassigned';
    RAISE NOTICE 'department column added successfully';
  END IF;

  -- Add position column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'position'
  ) THEN
    ALTER TABLE users ADD COLUMN position TEXT DEFAULT 'Employee';
    RAISE NOTICE 'position column added successfully';
  END IF;

END $$;

-- Set default values for existing records
UPDATE users 
SET 
  full_name = COALESCE(full_name, email),
  avatar_url = COALESCE(avatar_url, ''),
  phone = COALESCE(phone, ''),
  location = COALESCE(location, ''),
  bio = COALESCE(bio, ''),
  status = COALESCE(status, 'active'),
  role = COALESCE(role, 'employee'),
  department = COALESCE(department, 'Unassigned'),
  position = COALESCE(position, 'Employee'),
  updated_at = COALESCE(updated_at, NOW()),
  created_at = COALESCE(created_at, NOW())
WHERE 
  full_name IS NULL 
  OR avatar_url IS NULL 
  OR phone IS NULL 
  OR location IS NULL 
  OR bio IS NULL 
  OR status IS NULL 
  OR role IS NULL 
  OR department IS NULL 
  OR position IS NULL 
  OR updated_at IS NULL 
  OR created_at IS NULL;

-- Verify all columns are now present
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Add comments for better documentation
COMMENT ON COLUMN users.full_name IS 'User full name';
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile avatar image';
COMMENT ON COLUMN users.phone IS 'User phone number';
COMMENT ON COLUMN users.location IS 'User location/address';
COMMENT ON COLUMN users.bio IS 'User biography/description';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN users.created_at IS 'Creation timestamp';
COMMENT ON COLUMN users.auth_user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN users.status IS 'User account status (active/inactive)';
COMMENT ON COLUMN users.role IS 'User role in the system';
COMMENT ON COLUMN users.department IS 'User department';
COMMENT ON COLUMN users.position IS 'User job position';

-- Ensure RLS is enabled and policies are working
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  TO authenticated 
  USING (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  TO authenticated 
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" 
  ON users FOR INSERT 
  TO authenticated 
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Success message (this will show in the results)
SELECT 'Users table schema has been updated successfully!' as status;

-- Add avatar_url column to users table
-- Run this in your Supabase SQL Editor

-- First, check if the users table exists and its current structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Add the avatar_url column if it doesn't exist
DO $$
BEGIN
  -- Check if avatar_url column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'avatar_url'
  ) THEN
    -- Add the avatar_url column
    ALTER TABLE users 
    ADD COLUMN avatar_url TEXT;
    
    RAISE NOTICE 'avatar_url column added successfully to users table';
  ELSE
    RAISE NOTICE 'avatar_url column already exists in users table';
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Update any existing users to have a default avatar_url if needed
UPDATE users 
SET avatar_url = '' 
WHERE avatar_url IS NULL;

-- Grant necessary permissions (if using RLS)
-- This ensures the column is accessible through your RLS policies
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile avatar image';

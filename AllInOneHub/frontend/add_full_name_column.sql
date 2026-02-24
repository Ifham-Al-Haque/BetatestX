-- Add missing full_name column to users table
-- Run this in your Supabase SQL Editor

-- Check current users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Add full_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name TEXT;
    RAISE NOTICE 'full_name column added successfully to users table';
  ELSE
    RAISE NOTICE 'full_name column already exists in users table';
  END IF;
END $$;

-- Set default values for existing records (use email as fallback for full_name)
UPDATE users 
SET full_name = COALESCE(full_name, email)
WHERE full_name IS NULL;

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

-- Add comment for documentation
COMMENT ON COLUMN users.full_name IS 'User full name';

-- Success message
SELECT 'full_name column has been added successfully!' as status;


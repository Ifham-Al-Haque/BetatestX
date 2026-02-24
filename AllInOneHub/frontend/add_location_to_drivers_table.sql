-- Add location field to drivers table
-- Run this in Supabase SQL Editor

-- Step 1: Add the location column to the drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Step 2: Add a comment to describe the column
COMMENT ON COLUMN drivers.location IS 'Driver location/emirate (Dubai, Abu Dhabi, etc.)';

-- Step 3: Create an index for better performance when filtering by location
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(location);

-- Step 4: Create an index for team_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_drivers_team_type ON drivers(team_type);

-- Step 5: Create an index for designation if it doesn't exist  
CREATE INDEX IF NOT EXISTS idx_drivers_designation ON drivers(designation);

-- Step 6: Verify the column was added
SELECT 
    'Location column added successfully' as message,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND column_name = 'location';

-- Step 7: Show current drivers table structure
SELECT 
    'Current drivers table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
ORDER BY ordinal_position;

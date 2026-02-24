-- Optional: Populate sample location data for existing drivers
-- Run this AFTER running add_location_to_drivers_table.sql

-- Step 1: Update existing drivers with sample locations based on their current data
-- This is just an example - you can modify the logic based on your actual data

UPDATE drivers 
SET location = 'Dubai'
WHERE location IS NULL 
AND (
    team_type = 'Delivery' 
    OR team_type = 'Fleet'
    OR designation ILIKE '%dubai%'
);

UPDATE drivers 
SET location = 'Abu Dhabi'
WHERE location IS NULL 
AND (
    team_type = 'Logistics'
    OR designation ILIKE '%abu%'
    OR designation ILIKE '%ad%'
);

UPDATE drivers 
SET location = 'Sharjah'
WHERE location IS NULL 
AND (
    team_type = 'Transport'
    OR designation ILIKE '%sharjah%'
);

-- Step 2: Set default location for any remaining null values
UPDATE drivers 
SET location = 'Dubai'
WHERE location IS NULL;

-- Step 3: Verify the updates
SELECT 
    'Location distribution after update:' as info,
    location,
    COUNT(*) as driver_count
FROM drivers 
GROUP BY location
ORDER BY driver_count DESC;

-- Step 4: Show sample of updated drivers
SELECT 
    'Sample of updated drivers:' as info,
    full_name,
    designation,
    team_type,
    location,
    status
FROM drivers 
ORDER BY created_at DESC
LIMIT 10;

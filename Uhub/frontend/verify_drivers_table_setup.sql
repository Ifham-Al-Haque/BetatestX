-- Verify drivers table setup for new filters
-- Run this to check if everything is properly configured

-- Step 1: Check if all required columns exist
SELECT 
    'Required columns check:' as info,
    column_name,
    CASE 
        WHEN column_name IN ('team_type', 'designation', 'location') 
        THEN '✅ Required for filters'
        ELSE '📋 Standard column'
    END as filter_status
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND column_name IN ('team_type', 'designation', 'location', 'status', 'shift_type')
ORDER BY column_name;

-- Step 2: Check existing indexes
SELECT 
    'Existing indexes:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'drivers'
ORDER BY indexname;

-- Step 3: Check data distribution for filter options
SELECT 
    'Team Type Distribution:' as info,
    team_type,
    COUNT(*) as count
FROM drivers 
WHERE team_type IS NOT NULL AND team_type != ''
GROUP BY team_type
ORDER BY count DESC;

SELECT 
    'Designation Distribution:' as info,
    designation,
    COUNT(*) as count
FROM drivers 
WHERE designation IS NOT NULL AND designation != ''
GROUP BY designation
ORDER BY count DESC;

SELECT 
    'Location Distribution:' as info,
    location,
    COUNT(*) as count
FROM drivers 
WHERE location IS NOT NULL AND location != ''
GROUP BY location
ORDER BY count DESC;

SELECT 
    'Status Distribution:' as info,
    status,
    COUNT(*) as count
FROM drivers 
GROUP BY status
ORDER BY count DESC;

SELECT 
    'Shift Type Distribution:' as info,
    shift_type,
    COUNT(*) as count
FROM drivers 
WHERE shift_type IS NOT NULL AND shift_type != ''
GROUP BY shift_type
ORDER BY count DESC;

-- Step 4: Check for any missing data
SELECT 
    'Data completeness check:' as info,
    COUNT(*) as total_drivers,
    COUNT(team_type) as with_team_type,
    COUNT(designation) as with_designation,
    COUNT(location) as with_location,
    COUNT(status) as with_status,
    COUNT(shift_type) as with_shift_type
FROM drivers;

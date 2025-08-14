-- =====================================================
-- ADD ACCESS CREDENTIALS TO DRIVERS TABLE
-- =====================================================

-- Add access credential columns to the drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS udrive_email VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS udrive_password VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS zimyo_email VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS zimyo_password VARCHAR(255);

-- Add comments to document the new fields
COMMENT ON COLUMN drivers.udrive_email IS 'Udrive company email address for the driver';
COMMENT ON COLUMN drivers.udrive_password IS 'Udrive account password for the driver';
COMMENT ON COLUMN drivers.zimyo_email IS 'Zimyo platform email address for the driver';
COMMENT ON COLUMN drivers.zimyo_password IS 'Zimyo platform password for the driver';

-- Create indexes for better performance on credential fields
CREATE INDEX IF NOT EXISTS idx_drivers_udrive_email ON drivers(udrive_email);
CREATE INDEX IF NOT EXISTS idx_drivers_zimyo_email ON drivers(zimyo_email);

-- Update existing sample data with sample credentials (for testing purposes)
UPDATE drivers 
SET 
    udrive_email = CASE 
        WHEN employee_id = 'DRV001' THEN 'ahmed.mansouri@udrive.com'
        WHEN employee_id = 'DRV002' THEN 'fatima.zaabi@udrive.com'
        WHEN employee_id = 'DRV003' THEN 'mohammed.falasi@udrive.com'
        ELSE NULL
    END,
    zimyo_email = CASE 
        WHEN employee_id = 'DRV001' THEN 'ahmed.mansouri@zimyo.com'
        WHEN employee_id = 'DRV002' THEN 'fatima.zaabi@zimyo.com'
        WHEN employee_id = 'DRV003' THEN 'mohammed.falasi@zimyo.com'
        ELSE NULL
    END
WHERE employee_id IN ('DRV001', 'DRV002', 'DRV003');

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND column_name IN ('udrive_email', 'udrive_password', 'zimyo_email', 'zimyo_password')
ORDER BY ordinal_position;

-- Show sample data with new fields
SELECT 
    full_name,
    employee_id,
    udrive_email,
    zimyo_email
FROM drivers
WHERE employee_id IN ('DRV001', 'DRV002', 'DRV003');

-- Grant necessary permissions (if not already granted)
GRANT ALL ON drivers TO authenticated;

-- Success message
SELECT '=== ACCESS CREDENTIALS ADDED TO DRIVERS TABLE ===' as info;
SELECT 'New fields added: udrive_email, udrive_password, zimyo_email, zimyo_password' as success_message;

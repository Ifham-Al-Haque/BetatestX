-- Database Migration Script for Assets Table
-- Run this in your Supabase SQL editor to add the missing columns

-- Add new columns to assets table
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN assets.serial_number IS 'Asset serial number for tracking';
COMMENT ON COLUMN assets.purchase_date IS 'Date when asset was purchased';
COMMENT ON COLUMN assets.warranty_expiry IS 'Warranty expiration date';
COMMENT ON COLUMN assets.purchase_price IS 'Purchase price in AED';
COMMENT ON COLUMN assets.location IS 'Physical location of the asset';
COMMENT ON COLUMN assets.notes IS 'Additional notes about the asset';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON assets(purchase_date);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assets' 
ORDER BY ordinal_position; 
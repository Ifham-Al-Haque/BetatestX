-- Fix Complaints Table Schema - Add Missing Columns
-- This script adds the missing columns that the frontend expects

-- Add missing columns to complaints table
DO $$
BEGIN
    -- Add complainant_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' AND column_name = 'complainant_email'
    ) THEN
        ALTER TABLE complaints ADD COLUMN complainant_email VARCHAR(255);
        RAISE NOTICE 'Added complainant_email column to complaints table';
    ELSE
        RAISE NOTICE 'complainant_email column already exists';
    END IF;

    -- Add complainant_department column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' AND column_name = 'complainant_department'
    ) THEN
        ALTER TABLE complaints ADD COLUMN complainant_department VARCHAR(100);
        RAISE NOTICE 'Added complainant_department column to complaints table';
    ELSE
        RAISE NOTICE 'complainant_department column already exists';
    END IF;

    -- Add assigned_department column if it doesn't exist (for management purposes)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' AND column_name = 'assigned_department'
    ) THEN
        ALTER TABLE complaints ADD COLUMN assigned_department VARCHAR(100);
        RAISE NOTICE 'Added assigned_department column to complaints table';
    ELSE
        RAISE NOTICE 'assigned_department column already exists';
    END IF;
END $$;

-- Create or replace the anonymous complaint handling function
CREATE OR REPLACE FUNCTION handle_anonymous_complaint()
RETURNS TRIGGER AS $$
BEGIN
    -- If the complaint is marked as anonymous, anonymize the data
    IF NEW.anonymous = TRUE THEN
        NEW.complainant_name = 'Anonymous';
        NEW.complainant_email = NULL;
        NEW.complainant_department = NULL;
    END IF;
    
    -- Always update the updated_at timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_handle_anonymous_complaint ON complaints;

-- Create trigger that runs before INSERT and UPDATE
CREATE TRIGGER trigger_handle_anonymous_complaint
    BEFORE INSERT OR UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION handle_anonymous_complaint();

-- Update existing anonymous complaints to ensure they are properly anonymized
UPDATE complaints 
SET 
    complainant_name = 'Anonymous',
    complainant_email = NULL,
    complainant_department = NULL,
    updated_at = NOW()
WHERE anonymous = TRUE AND (
    complainant_name != 'Anonymous' OR 
    complainant_email IS NOT NULL OR 
    complainant_department IS NOT NULL
);

-- Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_email ON complaints(complainant_email);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_department ON complaints(complainant_department);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_department ON complaints(assigned_department);

-- Add comments for documentation
COMMENT ON COLUMN complaints.complainant_email IS 'Email of complainant. Set to NULL for anonymous complaints';
COMMENT ON COLUMN complaints.complainant_department IS 'Department of complainant. Set to NULL for anonymous complaints';
COMMENT ON COLUMN complaints.assigned_department IS 'Department assigned to handle this complaint';
COMMENT ON COLUMN complaints.anonymous IS 'When TRUE, complainant identity is anonymized';

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'complaints' 
ORDER BY ordinal_position;

-- Show a summary of what was done
SELECT 
    'Schema update completed successfully' as status
UNION ALL
SELECT 
    'Trigger created: handle_anonymous_complaint' as status
UNION ALL
SELECT 
    'Updated ' || COUNT(*)::text || ' existing anonymous complaints' as status
FROM complaints 
WHERE anonymous = TRUE;

-- Test query to verify anonymous complaints are working
SELECT 
    id,
    title,
    anonymous,
    complainant_name,
    complainant_email,
    complainant_department,
    created_at
FROM complaints 
WHERE anonymous = TRUE
LIMIT 3;

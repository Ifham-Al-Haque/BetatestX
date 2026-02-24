-- Add missing fields to existing complaints table
-- This script adds the complainant_email, complainant_department, and assigned_department fields

-- Add complainant_email field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' 
        AND column_name = 'complainant_email'
    ) THEN
        ALTER TABLE complaints ADD COLUMN complainant_email VARCHAR(255);
        RAISE NOTICE 'Added complainant_email column to complaints table';
    ELSE
        RAISE NOTICE 'complainant_email column already exists in complaints table';
    END IF;
END $$;

-- Add complainant_department field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' 
        AND column_name = 'complainant_department'
    ) THEN
        ALTER TABLE complaints ADD COLUMN complainant_department VARCHAR(100);
        RAISE NOTICE 'Added complainant_department column to complaints table';
    ELSE
        RAISE NOTICE 'complainant_department column already exists in complaints table';
    END IF;
END $$;

-- Add assigned_department field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' 
        AND column_name = 'assigned_department'
    ) THEN
        ALTER TABLE complaints ADD COLUMN assigned_department VARCHAR(100);
        RAISE NOTICE 'Added assigned_department column to complaints table';
    ELSE
        RAISE NOTICE 'assigned_department column already exists in complaints table';
    END IF;
END $$;

-- Create index for assigned_department if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'complaints' 
        AND indexname = 'idx_complaints_assigned_department'
    ) THEN
        CREATE INDEX idx_complaints_assigned_department ON complaints(assigned_department);
        RAISE NOTICE 'Created index for assigned_department column';
    ELSE
        RAISE NOTICE 'Index for assigned_department already exists';
    END IF;
END $$;

-- Update existing complaints to set default values for new fields
UPDATE complaints 
SET 
    complainant_email = COALESCE(complainant_email, ''),
    complainant_department = COALESCE(complainant_department, 'Unassigned'),
    assigned_department = COALESCE(assigned_department, '')
WHERE 
    complainant_email IS NULL 
    OR complainant_department IS NULL 
    OR assigned_department IS NULL;

-- Verify the changes
SELECT 
    'Complaints table fields updated successfully' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'complaints') as total_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'complainant_email') as has_complainant_email,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'complainant_department') as has_complainant_department,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'assigned_department') as has_assigned_department;

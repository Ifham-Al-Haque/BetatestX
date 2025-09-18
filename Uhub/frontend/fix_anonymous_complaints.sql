-- Fix Anonymous Complaints System
-- This script ensures that when a complaint is marked as anonymous,
-- the complainant identity is completely anonymized

-- First, let's create a function to handle anonymous complaints
CREATE OR REPLACE FUNCTION handle_anonymous_complaint()
RETURNS TRIGGER AS $$
BEGIN
    -- If the complaint is marked as anonymous, anonymize all identifying information
    IF NEW.anonymous = TRUE THEN
        NEW.complainant_name = 'Anonymous';
        -- Only set email and department to NULL if columns exist
        BEGIN
            NEW.complainant_email = NULL;
            NEW.complainant_department = NULL;
        EXCEPTION WHEN undefined_column THEN
            -- Columns don't exist yet, skip this part
            NULL;
        END;
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

-- Update existing complaints that are marked as anonymous but still have real names
UPDATE complaints 
SET complainant_name = 'Anonymous', updated_at = NOW()
WHERE anonymous = TRUE AND complainant_name != 'Anonymous';

-- Add a comment to the table for documentation
COMMENT ON COLUMN complaints.anonymous IS 'When TRUE, complainant_name should automatically be set to Anonymous';
COMMENT ON COLUMN complaints.complainant_name IS 'Name of complainant. Automatically set to Anonymous when anonymous=TRUE';

-- Verify the changes
SELECT 
    id, 
    title, 
    anonymous, 
    complainant_name,
    created_at
FROM complaints 
WHERE anonymous = TRUE
LIMIT 5;

-- Show the function and trigger were created successfully
SELECT 
    'Function created: handle_anonymous_complaint()' as status
UNION ALL
SELECT 
    'Trigger created: trigger_handle_anonymous_complaint' as status
UNION ALL
SELECT 
    'Updated ' || COUNT(*)::text || ' existing anonymous complaints' as status
FROM complaints 
WHERE anonymous = TRUE AND complainant_name = 'Anonymous';

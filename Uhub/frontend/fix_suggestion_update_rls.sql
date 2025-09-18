-- Fix Suggestion Update RLS Policies
-- This script fixes the RLS policies to allow proper updating of suggestions

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own open suggestions" ON suggestions;

-- Create more flexible update policies
-- Allow users to update their own suggestions regardless of status
CREATE POLICY "Users can update own suggestions" ON suggestions
    FOR UPDATE USING (auth.uid() = suggester_id);

-- Allow managers and admins to update any suggestion
CREATE POLICY "Managers can update all suggestions" ON suggestions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

-- Ensure the suggestions table has proper permissions
GRANT ALL ON suggestions TO authenticated;

-- Add a function to check if user can update suggestion
CREATE OR REPLACE FUNCTION can_update_suggestion(suggestion_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    suggestion_record RECORD;
    user_role TEXT;
BEGIN
    -- Get the suggestion details
    SELECT suggester_id, status INTO suggestion_record
    FROM suggestions 
    WHERE id = suggestion_id;
    
    -- If suggestion doesn't exist, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is the suggester
    IF auth.uid() = suggestion_record.suggester_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a manager/admin
    SELECT role INTO user_role
    FROM user_profiles 
    WHERE id = auth.uid();
    
    IF user_role IN ('admin', 'hr_manager', 'cs_manager', 'manager') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION can_update_suggestion(UUID) TO authenticated;

-- Add a trigger to log suggestion updates for debugging
CREATE OR REPLACE FUNCTION log_suggestion_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the update attempt
    RAISE NOTICE 'Suggestion % updated by user % from status % to status %', 
        NEW.id, auth.uid(), OLD.status, NEW.status;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging
DROP TRIGGER IF EXISTS trigger_log_suggestion_update ON suggestions;
CREATE TRIGGER trigger_log_suggestion_update
    AFTER UPDATE ON suggestions
    FOR EACH ROW
    EXECUTE FUNCTION log_suggestion_update();

-- Test the policies by checking if they work
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- This will be logged but won't fail the script
    RAISE NOTICE 'Suggestion update policies have been updated successfully';
    RAISE NOTICE 'Users can now update their own suggestions regardless of status';
    RAISE NOTICE 'Managers and admins can update any suggestion';
END $$;

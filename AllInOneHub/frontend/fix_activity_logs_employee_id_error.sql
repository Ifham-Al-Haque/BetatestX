-- Fix Activity Logs Employee ID Column Error
-- This script adds the missing employee_id column to the activity_logs table
-- and updates any references that might be causing the error

-- Check current activity_logs table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
ORDER BY ordinal_position;

-- Add missing columns to activity_logs table
DO $$
BEGIN
    -- Check if employee_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'employee_id'
    ) THEN
        -- Add employee_id column as a reference to employees table
        ALTER TABLE public.activity_logs 
        ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added employee_id column to activity_logs table';
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_id ON public.activity_logs(employee_id);
        
        RAISE NOTICE '✅ Created index for employee_id column';
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.activity_logs.employee_id IS 'Reference to employee who performed the activity. Can be NULL for system activities.';
        
    ELSE
        RAISE NOTICE '⚠️ employee_id column already exists in activity_logs table';
    END IF;

    -- Check if changes column exists and add it if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'changes'
    ) THEN
        -- Add changes column for tracking field changes
        ALTER TABLE public.activity_logs 
        ADD COLUMN changes JSONB;
        
        RAISE NOTICE '✅ Added changes column to activity_logs table';
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.activity_logs.changes IS 'JSONB field to store specific changes made to records. Can contain field-level change information.';
        
    ELSE
        RAISE NOTICE '⚠️ changes column already exists in activity_logs table';
    END IF;
END $$;

-- First, drop any existing log_user_activity functions to avoid conflicts
DROP FUNCTION IF EXISTS log_user_activity CASCADE;

-- Update the log_user_activity function to handle employee_id and changes parameters
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID DEFAULT NULL,
    p_user_email TEXT DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL,
    p_action TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_method TEXT DEFAULT NULL,
    p_status_code INTEGER DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_employee_id UUID DEFAULT NULL,  -- NEW: Added employee_id parameter
    p_changes JSONB DEFAULT NULL     -- NEW: Added changes parameter
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
    resolved_employee_id UUID;
BEGIN
    -- Try to resolve employee_id if not provided directly
    IF p_employee_id IS NULL AND p_user_id IS NOT NULL THEN
        -- Try to find employee_id through users table
        SELECT u.employee_id INTO resolved_employee_id
        FROM public.users u
        WHERE u.auth_user_id = p_user_id;
        
        -- If still not found, try to find by email in employees table
        IF resolved_employee_id IS NULL AND p_user_email IS NOT NULL THEN
            SELECT e.id INTO resolved_employee_id
            FROM public.employees e
            WHERE e.email = p_user_email;
        END IF;
    ELSE
        resolved_employee_id := p_employee_id;
    END IF;

    INSERT INTO public.activity_logs (
        user_id, user_email, user_role, action, description,
        resource_type, resource_id, old_values, new_values,
        ip_address, user_agent, session_id, page_url,
        method, status_code, duration_ms, metadata, employee_id, changes
    ) VALUES (
        p_user_id, p_user_email, p_user_role, p_action, p_description,
        p_resource_type, p_resource_id, p_old_values, p_new_values,
        p_ip_address, p_user_agent, p_session_id, p_page_url,
        p_method, p_status_code, p_duration_ms, p_metadata, resolved_employee_id, p_changes
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to include employee_id access patterns
-- Drop and recreate policies to include employee_id references

-- Employees can view activity logs related to them
DROP POLICY IF EXISTS "Employees can view own activity logs" ON public.activity_logs;
CREATE POLICY "Employees can view own activity logs" ON public.activity_logs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid() AND u.employee_id = activity_logs.employee_id
        )
    );

-- Update existing activity logs to populate employee_id where possible
DO $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update activity_logs with employee_id from users table
    UPDATE public.activity_logs 
    SET employee_id = u.employee_id
    FROM public.users u
    WHERE activity_logs.user_id = u.auth_user_id 
    AND activity_logs.employee_id IS NULL
    AND u.employee_id IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % activity log records with employee_id from users table', updated_count;
    
    -- Update remaining records by matching email with employees table
    UPDATE public.activity_logs 
    SET employee_id = e.id
    FROM public.employees e
    WHERE activity_logs.user_email = e.email 
    AND activity_logs.employee_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % additional activity log records with employee_id from employees table', updated_count;
END $$;

-- Verify the table structure after changes
SELECT 
    'Updated activity_logs table structure:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
ORDER BY ordinal_position;

-- Show summary statistics
SELECT 
    COUNT(*) as total_activity_logs,
    COUNT(employee_id) as logs_with_employee_id,
    COUNT(*) - COUNT(employee_id) as logs_without_employee_id,
    ROUND(
        (COUNT(employee_id)::numeric / COUNT(*)::numeric) * 100, 2
    ) as employee_id_coverage_percentage
FROM public.activity_logs;

-- Test the updated function
DO $$
BEGIN
    PERFORM log_user_activity(
        p_action := 'test_activity'::TEXT,
        p_description := 'Testing updated activity logging with employee_id support'::TEXT,
        p_user_email := 'admin@udrive.com'::TEXT,
        p_user_role := 'admin'::TEXT,
        p_page_url := '/test'::TEXT,
        p_method := 'POST'::TEXT,
        p_status_code := 200::INTEGER
    );
    
    RAISE NOTICE '✅ Successfully tested updated log_user_activity function';
END $$;

-- Final completion message
DO $$
BEGIN
    RAISE NOTICE '🎉 Activity logs employee_id fix completed successfully!';
END $$;

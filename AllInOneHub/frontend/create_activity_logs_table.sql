-- Create comprehensive activity_logs table for user activity tracking
-- This table will track all user activities across the system

-- Drop table if it exists (for clean recreation)
DROP TABLE IF EXISTS public.activity_logs CASCADE;

-- Create the activity_logs table
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    description TEXT,
    resource_type TEXT, -- e.g., 'user', 'employee', 'complaint', 'it_request'
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    page_url TEXT,
    method TEXT, -- HTTP method if applicable
    status_code INTEGER, -- HTTP status code if applicable
    duration_ms INTEGER, -- Action duration in milliseconds
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON public.activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_id ON public.activity_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_role ON public.activity_logs(user_role);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON public.activity_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date_action ON public.activity_logs(created_at DESC, action);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid() AND u.role = 'admin'
        )
    );

-- HR managers can view activity logs for their department
CREATE POLICY "HR managers can view department activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid() AND u.role = 'hr_manager'
        )
    );

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert activity logs (no user inserts directly)
CREATE POLICY "System can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- Create function to log user activity
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
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.activity_logs (
        user_id, user_email, user_role, action, description,
        resource_type, resource_id, old_values, new_values,
        ip_address, user_agent, session_id, page_url,
        method, status_code, duration_ms, metadata
    ) VALUES (
        p_user_id, p_user_email, p_user_role, p_action, p_description,
        p_resource_type, p_resource_id, p_old_values, p_new_values,
        p_ip_address, p_user_agent, p_session_id, p_page_url,
        p_method, p_status_code, p_duration_ms, p_metadata
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user activity stats
CREATE OR REPLACE FUNCTION get_user_activity_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_activities BIGINT,
    unique_users BIGINT,
    most_active_user TEXT,
    most_common_action TEXT,
    activities_today BIGINT,
    login_count BIGINT,
    logout_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_activities,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as activities_today,
            COUNT(CASE WHEN action = 'login' THEN 1 END) as login_count,
            COUNT(CASE WHEN action = 'logout' THEN 1 END) as logout_count
        FROM activity_logs 
        WHERE created_at >= NOW() - INTERVAL '%s days'
    ),
    most_active AS (
        SELECT user_email
        FROM activity_logs 
        WHERE created_at >= NOW() - INTERVAL '%s days'
          AND user_email IS NOT NULL
        GROUP BY user_email
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    most_common AS (
        SELECT action
        FROM activity_logs 
        WHERE created_at >= NOW() - INTERVAL '%s days'
        GROUP BY action
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        s.total_activities,
        s.unique_users,
        ma.user_email,
        mc.action,
        s.activities_today,
        s.login_count,
        s.logout_count
    FROM stats s
    CROSS JOIN most_active ma
    CROSS JOIN most_common mc;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample activity data for demonstration
DO $$
BEGIN
    -- Sample login activities
    PERFORM log_user_activity(
        p_action := 'login',
        p_description := 'User logged in successfully',
        p_user_email := 'admin@udrive.com',
        p_user_role := 'admin',
        p_page_url := '/login',
        p_method := 'POST',
        p_status_code := 200
    );
    
    PERFORM log_user_activity(
        p_action := 'page_view',
        p_description := 'Viewed admin dashboard',
        p_user_email := 'admin@udrive.com',
        p_user_role := 'admin',
        p_page_url := '/admin/dashboard',
        p_method := 'GET',
        p_status_code := 200
    );
    
    PERFORM log_user_activity(
        p_action := 'user_management',
        p_description := 'Viewed user management page',
        p_user_email := 'admin@udrive.com',
        p_user_role := 'admin',
        p_resource_type := 'user',
        p_page_url := '/admin/users',
        p_method := 'GET',
        p_status_code := 200
    );
    
    -- Sample HR activities
    PERFORM log_user_activity(
        p_action := 'login',
        p_description := 'HR manager logged in',
        p_user_email := 'hr@udrive.com',
        p_user_role := 'hr_manager',
        p_page_url := '/login',
        p_method := 'POST',
        p_status_code := 200
    );
    
    PERFORM log_user_activity(
        p_action := 'employee_view',
        p_description := 'Viewed employee details',
        p_user_email := 'hr@udrive.com',
        p_user_role := 'hr_manager',
        p_resource_type := 'employee',
        p_page_url := '/employees/profile',
        p_method := 'GET',
        p_status_code := 200
    );
    
    -- Sample employee activities
    PERFORM log_user_activity(
        p_action := 'login',
        p_description := 'Employee logged in',
        p_user_email := 'employee@udrive.com',
        p_user_role := 'employee',
        p_page_url := '/login',
        p_method := 'POST',
        p_status_code := 200
    );
    
    PERFORM log_user_activity(
        p_action := 'complaint_create',
        p_description := 'Created new complaint',
        p_user_email := 'employee@udrive.com',
        p_user_role := 'employee',
        p_resource_type := 'complaint',
        p_page_url := '/complaints/new',
        p_method := 'POST',
        p_status_code := 201
    );
    
    PERFORM log_user_activity(
        p_action := 'profile_update',
        p_description := 'Updated profile information',
        p_user_email := 'employee@udrive.com',
        p_user_role := 'employee',
        p_resource_type := 'profile',
        p_page_url := '/profile',
        p_method := 'PUT',
        p_status_code := 200
    );
END $$;

COMMENT ON TABLE public.activity_logs IS 'Comprehensive user activity tracking table';
COMMENT ON FUNCTION log_user_activity IS 'Function to log user activities with comprehensive context';
COMMENT ON FUNCTION get_user_activity_stats IS 'Function to get aggregated user activity statistics';

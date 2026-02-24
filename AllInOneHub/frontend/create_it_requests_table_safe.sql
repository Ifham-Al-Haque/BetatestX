-- Safe IT Requests Table Creation Script
-- This script creates a comprehensive IT request management system

-- Check if IT request categories table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'it_request_categories') THEN
        -- Create IT Request Categories Table
        CREATE TABLE it_request_categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3B82F6',
            icon VARCHAR(50) DEFAULT 'settings',
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Insert default categories
        INSERT INTO it_request_categories (name, description, color, icon, sort_order) VALUES
        ('Hardware', 'Computer hardware issues and requests', '#EF4444', 'monitor', 1),
        ('Software', 'Software installation and configuration', '#10B981', 'code', 2),
        ('Network', 'Network connectivity and access issues', '#3B82F6', 'wifi', 3),
        ('Email', 'Email and communication issues', '#8B5CF6', 'mail', 4),
        ('Access Control', 'User access and permissions', '#F59E0B', 'key', 5),
        ('Printing', 'Printer and printing issues', '#6B7280', 'printer', 6),
        ('Security', 'Security-related requests', '#DC2626', 'shield', 7),
        ('Other', 'Other IT-related requests', '#9CA3AF', 'help-circle', 8);

        RAISE NOTICE 'IT request categories table created successfully';
    ELSE
        RAISE NOTICE 'IT request categories table already exists, skipping creation';
    END IF;
END $$;

-- Check if IT request priorities table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'it_request_priorities') THEN
        -- Create IT Request Priorities Table
        CREATE TABLE it_request_priorities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
            description TEXT,
            color VARCHAR(7) DEFAULT '#6B7280',
            sla_hours INTEGER DEFAULT 72,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Insert default priorities
        INSERT INTO it_request_priorities (name, level, description, color, sla_hours) VALUES
        ('Critical', 1, 'System down or major security issue', '#DC2626', 2),
        ('High', 2, 'Business critical functionality affected', '#EF4444', 4),
        ('Medium', 3, 'Standard business request', '#F59E0B', 24),
        ('Low', 4, 'Non-urgent request', '#10B981', 72),
        ('Info', 5, 'Information request only', '#6B7280', 168);

        RAISE NOTICE 'IT request priorities table created successfully';
    ELSE
        RAISE NOTICE 'IT request priorities table already exists, skipping creation';
    END IF;
END $$;

-- Check if IT requests table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'it_requests') THEN
        -- Create IT Requests Table
        CREATE TABLE it_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            request_type VARCHAR(50) NOT NULL DEFAULT 'it_service',
            category_id UUID NOT NULL REFERENCES it_request_categories(id) ON DELETE RESTRICT,
            priority_id UUID NOT NULL REFERENCES it_request_priorities(id) ON DELETE RESTRICT,
            status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_user', 'resolved', 'closed', 'cancelled')),
            requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            assigned_at TIMESTAMP WITH TIME ZONE,
            estimated_completion_date DATE,
            actual_completion_date TIMESTAMP WITH TIME ZONE,
            resolution_notes TEXT,
            closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            closed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_it_requests_requester_id ON it_requests(requester_id);
        CREATE INDEX idx_it_requests_assigned_to ON it_requests(assigned_to);
        CREATE INDEX idx_it_requests_status ON it_requests(status);
        CREATE INDEX idx_it_requests_priority_id ON it_requests(priority_id);
        CREATE INDEX idx_it_requests_category_id ON it_requests(category_id);
        CREATE INDEX idx_it_requests_created_at ON it_requests(created_at);
        CREATE INDEX idx_it_requests_request_type ON it_requests(request_type);

        RAISE NOTICE 'IT requests table created successfully';
    ELSE
        RAISE NOTICE 'IT requests table already exists, skipping creation';
    END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'it_request_categories' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE it_request_categories ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on it_request_categories table';
    ELSE
        RAISE NOTICE 'RLS already enabled on it_request_categories table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'it_request_priorities' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE it_request_priorities ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on it_request_priorities table';
    ELSE
        RAISE NOTICE 'RLS already enabled on it_request_priorities table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'it_requests' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE it_requests ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on it_requests table';
    ELSE
        RAISE NOTICE 'RLS already enabled on it_requests table';
    END IF;
END $$;

-- Create RLS policies for it_request_categories (read-only for all authenticated users)
DO $$
BEGIN
    -- Policy 1: All authenticated users can view categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_request_categories' 
        AND policyname = 'All users can view categories'
    ) THEN
        CREATE POLICY "All users can view categories" ON it_request_categories
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Policy "All users can view categories" created';
    ELSE
        RAISE NOTICE 'Policy "All users can view categories" already exists';
    END IF;
END $$;

-- Create RLS policies for it_request_priorities (read-only for all authenticated users)
DO $$
BEGIN
    -- Policy 1: All authenticated users can view priorities
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_request_priorities' 
        AND policyname = 'All users can view priorities'
    ) THEN
        CREATE POLICY "All users can view priorities" ON it_request_priorities
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Policy "All users can view priorities" created';
    ELSE
        RAISE NOTICE 'Policy "All users can view priorities" already exists';
    END IF;
END $$;

-- Create RLS policies for it_requests
DO $$
BEGIN
    -- Policy 1: Users can view their own requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Users can view own requests'
    ) THEN
        CREATE POLICY "Users can view own requests" ON it_requests
            FOR SELECT USING (auth.uid() = requester_id);
        RAISE NOTICE 'Policy "Users can view own requests" created';
    ELSE
        RAISE NOTICE 'Policy "Users can view own requests" already exists';
    END IF;

    -- Policy 2: Tech roles and admins can view all requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Tech roles and admins can view all requests'
    ) THEN
        CREATE POLICY "Tech roles and admins can view all requests" ON it_requests
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
                )
            );
        RAISE NOTICE 'Policy "Tech roles and admins can view all requests" created';
    ELSE
        RAISE NOTICE 'Policy "Tech roles and admins can view all requests" already exists';
    END IF;

    -- Policy 3: Users can create their own requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Users can create own requests'
    ) THEN
        CREATE POLICY "Users can create own requests" ON it_requests
            FOR INSERT WITH CHECK (auth.uid() = requester_id);
        RAISE NOTICE 'Policy "Users can create own requests" created';
    ELSE
        RAISE NOTICE 'Policy "Users can create own requests" already exists';
    END IF;

    -- Policy 4: Users can update their own open requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Users can update own open requests'
    ) THEN
        CREATE POLICY "Users can update own open requests" ON it_requests
            FOR UPDATE USING (auth.uid() = requester_id AND status IN ('open', 'pending_user'));
        RAISE NOTICE 'Policy "Users can update own open requests" created';
    ELSE
        RAISE NOTICE 'Policy "Users can update own open requests" already exists';
    END IF;

    -- Policy 5: Tech roles and admins can update all requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Tech roles and admins can update all requests'
    ) THEN
        CREATE POLICY "Tech roles and admins can update all requests" ON it_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
                )
            );
        RAISE NOTICE 'Policy "Tech roles and admins can update all requests" created';
    ELSE
        RAISE NOTICE 'Policy "Tech roles and admins can update all requests" already exists';
    END IF;

    -- Policy 6: Users can delete their own open requests
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Users can delete own open requests'
    ) THEN
        CREATE POLICY "Users can delete own open requests" ON it_requests
            FOR DELETE USING (auth.uid() = requester_id AND status = 'open');
        RAISE NOTICE 'Policy "Users can delete own open requests" created';
    ELSE
        RAISE NOTICE 'Policy "Users can delete own open requests" already exists';
    END IF;

    -- Policy 7: Tech roles and admins can delete any request
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'it_requests' 
        AND policyname = 'Tech roles and admins can delete any request'
    ) THEN
        CREATE POLICY "Tech roles and admins can delete any request" ON it_requests
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'it_manager', 'it_support', 'tech_support')
                )
            );
        RAISE NOTICE 'Policy "Tech roles and admins can delete any request" created';
    ELSE
        RAISE NOTICE 'Policy "Tech roles and admins can delete any request" already exists';
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_it_requests_updated_at'
    ) THEN
        CREATE OR REPLACE FUNCTION update_it_requests_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE 'Function update_it_requests_updated_at created';
    ELSE
        RAISE NOTICE 'Function update_it_requests_updated_at already exists';
    END IF;
END $$;

-- Create trigger to automatically update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_it_requests_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_it_requests_updated_at
            BEFORE UPDATE ON it_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_it_requests_updated_at();
        RAISE NOTICE 'Trigger trigger_update_it_requests_updated_at created';
    ELSE
        RAISE NOTICE 'Trigger trigger_update_it_requests_updated_at already exists';
    END IF;
END $$;

-- Create a view for IT request statistics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'it_request_statistics'
    ) THEN
        CREATE OR REPLACE VIEW it_request_statistics AS
        SELECT 
            COUNT(*) as total_requests,
            COUNT(*) FILTER (WHERE status = 'open') as open_requests,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_requests,
            COUNT(*) FILTER (WHERE status = 'pending_user') as pending_user_requests,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_requests,
            COUNT(*) FILTER (WHERE status = 'closed') as closed_requests,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_requests,
            COUNT(*) FILTER (WHERE priority_id IN (
                SELECT id FROM it_request_priorities WHERE level <= 2
            )) as high_priority_requests,
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_response_time_hours
        FROM it_requests;
        RAISE NOTICE 'View it_request_statistics created';
    ELSE
        RAISE NOTICE 'View it_request_statistics already exists';
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON it_request_categories TO authenticated;
GRANT ALL ON it_request_priorities TO authenticated;
GRANT ALL ON it_requests TO authenticated;
GRANT ALL ON it_request_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE it_requests IS 'Stores IT service requests with role-based access control';
COMMENT ON TABLE it_request_categories IS 'Categories for IT service requests';
COMMENT ON TABLE it_request_priorities IS 'Priority levels for IT service requests';
COMMENT ON COLUMN it_requests.estimated_completion_date IS 'Estimated date when the request will be completed';
COMMENT ON COLUMN it_requests.resolution_notes IS 'Notes about how the request was resolved';
COMMENT ON COLUMN it_requests.sla_hours IS 'Service Level Agreement hours for this priority level';

-- Final verification
SELECT 
    'IT Requests system setup completed successfully' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('it_requests', 'it_request_categories', 'it_request_priorities')) as tables_created,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('it_requests', 'it_request_categories', 'it_request_priorities')) as policies_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('it_requests', 'it_request_categories', 'it_request_priorities')) as indexes_count;

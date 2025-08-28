-- Safe Complaints Table Creation Script
-- This script checks for existing objects and avoids conflicts

-- Check if complaints table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'complaints') THEN
        -- Create Complaints Table
        CREATE TABLE complaints (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(100) NOT NULL,
            priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            anonymous BOOLEAN DEFAULT FALSE,
            complainant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            complainant_name VARCHAR(255) NOT NULL,
            complainant_email VARCHAR(255),
            complainant_department VARCHAR(100),
            assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            assigned_department VARCHAR(100),
            assigned_at TIMESTAMP WITH TIME ZONE,
            resolved_at TIMESTAMP WITH TIME ZONE,
            resolution_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_complaints_complainant_id ON complaints(complainant_id);
        CREATE INDEX idx_complaints_status ON complaints(status);
        CREATE INDEX idx_complaints_priority ON complaints(priority);
        CREATE INDEX idx_complaints_category ON complaints(category);
        CREATE INDEX idx_complaints_created_at ON complaints(created_at);
        CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
        CREATE INDEX idx_complaints_assigned_department ON complaints(assigned_department);

        RAISE NOTICE 'Complaints table created successfully';
    ELSE
        RAISE NOTICE 'Complaints table already exists, skipping creation';
    END IF;
END $$;

-- Enable Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'complaints' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on complaints table';
    ELSE
        RAISE NOTICE 'RLS already enabled on complaints table';
    END IF;
END $$;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    -- Policy 1: Users can view own complaints
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Users can view own complaints'
    ) THEN
        CREATE POLICY "Users can view own complaints" ON complaints
            FOR SELECT USING (auth.uid() = complainant_id);
        RAISE NOTICE 'Policy "Users can view own complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Users can view own complaints" already exists';
    END IF;

    -- Policy 2: Users can create own complaints
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Users can create own complaints'
    ) THEN
        CREATE POLICY "Users can create own complaints" ON complaints
            FOR INSERT WITH CHECK (auth.uid() = complainant_id);
        RAISE NOTICE 'Policy "Users can create own complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Users can create own complaints" already exists';
    END IF;

    -- Policy 3: Users can update own complaints (if status is open)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Users can update own open complaints'
    ) THEN
        CREATE POLICY "Users can update own open complaints" ON complaints
            FOR UPDATE USING (auth.uid() = complainant_id AND status = 'open');
        RAISE NOTICE 'Policy "Users can update own open complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Users can update own open complaints" already exists';
    END IF;

    -- Policy 4: Users can delete own complaints (if status is open)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Users can delete own open complaints'
    ) THEN
        CREATE POLICY "Users can delete own open complaints" ON complaints
            FOR DELETE USING (auth.uid() = complainant_id AND status = 'open');
        RAISE NOTICE 'Policy "Users can delete own open complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Users can delete own open complaints" already exists';
    END IF;

    -- Policy 5: Admins can view all complaints
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Admins can view all complaints'
    ) THEN
        CREATE POLICY "Admins can view all complaints" ON complaints
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'hr', 'manager')
                )
            );
        RAISE NOTICE 'Policy "Admins can view all complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Admins can view all complaints" already exists';
    END IF;

    -- Policy 6: Admins can update all complaints
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Admins can update all complaints'
    ) THEN
        CREATE POLICY "Admins can update all complaints" ON complaints
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'hr', 'manager')
                )
            );
        RAISE NOTICE 'Policy "Admins can update all complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Admins can update all complaints" already exists';
    END IF;

    -- Policy 7: Admins can delete all complaints
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'complaints' 
        AND policyname = 'Admins can delete all complaints'
    ) THEN
        CREATE POLICY "Admins can delete all complaints" ON complaints
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.auth_user_id = auth.uid() 
                    AND users.role IN ('admin', 'hr', 'manager')
                )
            );
        RAISE NOTICE 'Policy "Admins can delete all complaints" created';
    ELSE
        RAISE NOTICE 'Policy "Admins can delete all complaints" already exists';
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_complaints_updated_at'
    ) THEN
        CREATE OR REPLACE FUNCTION update_complaints_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE 'Function update_complaints_updated_at created';
    ELSE
        RAISE NOTICE 'Function update_complaints_updated_at already exists';
    END IF;
END $$;

-- Create trigger to automatically update updated_at (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_complaints_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_complaints_updated_at
            BEFORE UPDATE ON complaints
            FOR EACH ROW
            EXECUTE FUNCTION update_complaints_updated_at();
        RAISE NOTICE 'Trigger trigger_update_complaints_updated_at created';
    ELSE
        RAISE NOTICE 'Trigger trigger_update_complaints_updated_at already exists';
    END IF;
END $$;

-- Create a view for complaint statistics (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'complaint_statistics'
    ) THEN
        CREATE OR REPLACE VIEW complaint_statistics AS
        SELECT 
            COUNT(*) as total_complaints,
            COUNT(*) FILTER (WHERE status = 'open') as open_complaints,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_complaints,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_complaints,
            COUNT(*) FILTER (WHERE status = 'closed') as closed_complaints,
            COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_complaints,
            COUNT(*) FILTER (WHERE priority = 'high') as high_complaints,
            COUNT(*) FILTER (WHERE priority = 'medium') as medium_complaints,
            COUNT(*) FILTER (WHERE priority = 'low') as low_complaints
        FROM complaints;
        RAISE NOTICE 'View complaint_statistics created';
    ELSE
        RAISE NOTICE 'View complaint_statistics already exists';
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON complaints TO authenticated;
GRANT ALL ON complaint_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE complaints IS 'Stores employee complaints and grievances with role-based access control';
COMMENT ON COLUMN complaints.anonymous IS 'Whether the complaint was submitted anonymously';
COMMENT ON COLUMN complaints.assigned_to IS 'User assigned to handle this complaint (for admins/HR)';
COMMENT ON COLUMN complaints.resolution_notes IS 'Notes about how the complaint was resolved';

-- Final verification
SELECT 
    'Complaints table setup completed successfully' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'complaints') as table_exists,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'complaints') as policies_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'complaints') as indexes_count;

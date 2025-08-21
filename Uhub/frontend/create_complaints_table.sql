-- Create Complaints Table for Real-time Complaint Management
-- This table will store actual complaints submitted by users

CREATE TABLE IF NOT EXISTS complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    anonymous BOOLEAN DEFAULT FALSE,
    complainant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    complainant_name VARCHAR(255) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_id ON complaints(complainant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);

-- Enable Row Level Security (RLS)
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see their own complaints
CREATE POLICY "Users can view own complaints" ON complaints
    FOR SELECT USING (auth.uid() = complainant_id);

-- Users can create their own complaints
CREATE POLICY "Users can create own complaints" ON complaints
    FOR INSERT WITH CHECK (auth.uid() = complainant_id);

-- Users can update their own complaints (if status is open)
CREATE POLICY "Users can update own open complaints" ON complaints
    FOR UPDATE USING (auth.uid() = complainant_id AND status = 'open');

-- Users can delete their own complaints (if status is open)
CREATE POLICY "Users can delete own open complaints" ON complaints
    FOR DELETE USING (auth.uid() = complainant_id AND status = 'open');

-- Admins, HR, and managers can see all complaints
CREATE POLICY "Admins can view all complaints" ON complaints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr', 'manager')
        )
    );

-- Admins, HR, and managers can update all complaints
CREATE POLICY "Admins can update all complaints" ON complaints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr', 'manager')
        )
    );

-- Admins, HR, and managers can delete all complaints
CREATE POLICY "Admins can delete all complaints" ON complaints
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr', 'manager')
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_complaints_updated_at();

-- Insert some initial categories if you want to pre-populate them
-- You can remove this if you prefer to manage categories through the UI
INSERT INTO complaints_categories (name, description, color) VALUES
    ('Work Environment', 'Issues related to workplace conditions, equipment, or facilities', 'blue'),
    ('Harassment', 'Reports of harassment, bullying, or inappropriate behavior', 'red'),
    ('Discrimination', 'Discrimination based on protected characteristics', 'orange'),
    ('Pay & Benefits', 'Issues with salary, benefits, or compensation', 'green'),
    ('Management Issues', 'Problems with management, leadership, or decision-making', 'purple'),
    ('Safety Concerns', 'Safety hazards or workplace safety issues', 'yellow'),
    ('Other', 'Other issues not covered by the above categories', 'gray')
ON CONFLICT (name) DO NOTHING;

-- Create a view for complaint statistics (optional)
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

-- Grant necessary permissions
GRANT ALL ON complaints TO authenticated;
GRANT ALL ON complaint_statistics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE complaints IS 'Stores employee complaints and grievances with role-based access control';
COMMENT ON COLUMN complaints.anonymous IS 'Whether the complaint was submitted anonymously';
COMMENT ON COLUMN complaints.assigned_to IS 'User assigned to handle this complaint (for admins/HR)';
COMMENT ON COLUMN complaints.resolution_notes IS 'Notes about how the complaint was resolved';

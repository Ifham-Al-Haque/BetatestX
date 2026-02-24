-- Create Suggestions Table for User Suggestions and Feedback
-- This table will store suggestions that can be user-specific or general

CREATE TABLE IF NOT EXISTS suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'implemented', 'closed')),
    suggestion_type VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (suggestion_type IN ('general', 'user_specific')),
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_name VARCHAR(255),
    suggester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    suggester_name VARCHAR(255) NOT NULL,
    anonymous BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    implementation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suggestions_suggester_id ON suggestions(suggester_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_target_user_id ON suggestions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_suggestion_type ON suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_assigned_to ON suggestions(assigned_to);

-- Enable Row Level Security (RLS)
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see their own suggestions
CREATE POLICY "Users can view own suggestions" ON suggestions
    FOR SELECT USING (auth.uid() = suggester_id);

-- Users can see suggestions targeted at them
CREATE POLICY "Users can view suggestions targeted at them" ON suggestions
    FOR SELECT USING (auth.uid() = target_user_id);

-- Users can see general suggestions (visible to all)
CREATE POLICY "Users can view general suggestions" ON suggestions
    FOR SELECT USING (suggestion_type = 'general');

-- Users can create their own suggestions
CREATE POLICY "Users can create own suggestions" ON suggestions
    FOR INSERT WITH CHECK (auth.uid() = suggester_id);

-- Users can update their own suggestions (if status is open)
CREATE POLICY "Users can update own open suggestions" ON suggestions
    FOR UPDATE USING (auth.uid() = suggester_id AND status = 'open');

-- Users can delete their own suggestions (if status is open)
CREATE POLICY "Users can delete own open suggestions" ON suggestions
    FOR DELETE USING (auth.uid() = suggester_id AND status = 'open');

-- Admins, HR, and managers can see all suggestions
CREATE POLICY "Admins can view all suggestions" ON suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

-- Admins, HR, and managers can update all suggestions
CREATE POLICY "Admins can update all suggestions" ON suggestions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

-- Admins, HR, and managers can delete all suggestions
CREATE POLICY "Admins can delete all suggestions" ON suggestions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_suggestions_updated_at
    BEFORE UPDATE ON suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_suggestions_updated_at();

-- Create suggestion categories table
CREATE TABLE IF NOT EXISTS suggestion_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default suggestion categories
INSERT INTO suggestion_categories (name, description, color) VALUES
    ('Process Improvement', 'Suggestions for improving workflows and processes', 'blue'),
    ('Technology', 'Technology-related suggestions and improvements', 'green'),
    ('Communication', 'Communication and collaboration improvements', 'purple'),
    ('Work Environment', 'Workplace environment and culture suggestions', 'orange'),
    ('Training & Development', 'Training and professional development ideas', 'teal'),
    ('Customer Service', 'Customer service and satisfaction improvements', 'pink'),
    ('Safety & Security', 'Safety and security enhancement suggestions', 'red'),
    ('Other', 'Other suggestions not covered by the above categories', 'gray')
ON CONFLICT (name) DO NOTHING;

-- Create a view for suggestion statistics
CREATE OR REPLACE VIEW suggestion_statistics AS
SELECT 
    COUNT(*) as total_suggestions,
    COUNT(*) FILTER (WHERE status = 'open') as open_suggestions,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_suggestions,
    COUNT(*) FILTER (WHERE status = 'implemented') as implemented_suggestions,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_suggestions,
    COUNT(*) FILTER (WHERE suggestion_type = 'general') as general_suggestions,
    COUNT(*) FILTER (WHERE suggestion_type = 'user_specific') as user_specific_suggestions,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_suggestions,
    COUNT(*) FILTER (WHERE priority = 'high') as high_suggestions,
    COUNT(*) FILTER (WHERE priority = 'medium') as medium_suggestions,
    COUNT(*) FILTER (WHERE priority = 'low') as low_suggestions
FROM suggestions;

-- Grant necessary permissions
GRANT ALL ON suggestions TO authenticated;
GRANT ALL ON suggestion_categories TO authenticated;
GRANT ALL ON suggestion_statistics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE suggestions IS 'Stores user suggestions and feedback with role-based access control';
COMMENT ON COLUMN suggestions.suggestion_type IS 'Whether the suggestion is general (visible to all) or user-specific (visible only to target user)';
COMMENT ON COLUMN suggestions.target_user_id IS 'User this suggestion is targeted at (NULL for general suggestions)';
COMMENT ON COLUMN suggestions.anonymous IS 'Whether the suggestion was submitted anonymously';
COMMENT ON COLUMN suggestions.upvotes IS 'Number of upvotes for this suggestion';
COMMENT ON COLUMN suggestions.downvotes IS 'Number of downvotes for this suggestion';
COMMENT ON COLUMN suggestions.assigned_to IS 'User assigned to handle this suggestion (for admins/HR)';
COMMENT ON COLUMN suggestions.implementation_notes IS 'Notes about how the suggestion was implemented';

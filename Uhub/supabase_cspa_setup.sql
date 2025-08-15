-- CSPA Database Setup Script for Supabase
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main imports table
CREATE TABLE IF NOT EXISTS cspa_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    data_type TEXT NOT NULL CHECK (data_type IN ('callCenter', 'ticket', 'unknown')),
    processed_data JSONB NOT NULL,
    analytics JSONB,
    summary JSONB,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the call analytics table for better performance
CREATE TABLE IF NOT EXISTS cspa_call_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    import_id UUID REFERENCES cspa_imports(id) ON DELETE CASCADE,
    direction_distribution JSONB,
    call_result_distribution JSONB,
    agent_distribution JSONB,
    queue_distribution JSONB,
    avg_talk_time DECIMAL(10,2),
    avg_time_in_queue DECIMAL(10,2),
    avg_on_hold_duration DECIMAL(10,2),
    total_calls INTEGER NOT NULL DEFAULT 0,
    inbound_calls INTEGER NOT NULL DEFAULT 0,
    outbound_calls INTEGER NOT NULL DEFAULT 0,
    abandoned_calls INTEGER NOT NULL DEFAULT 0,
    lost_in_ivr_calls INTEGER NOT NULL DEFAULT 0,
    avg_survey_rating DECIMAL(3,2),
    repeat_call_rate DECIMAL(5,2),
    agent_performance JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cspa_imports_user_id ON cspa_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_cspa_imports_data_type ON cspa_imports(data_type);
CREATE INDEX IF NOT EXISTS idx_cspa_imports_import_date ON cspa_imports(import_date);
CREATE INDEX IF NOT EXISTS idx_cspa_imports_status ON cspa_imports(status);
CREATE INDEX IF NOT EXISTS idx_cspa_call_analytics_import_id ON cspa_call_analytics(import_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_cspa_imports_updated_at 
    BEFORE UPDATE ON cspa_imports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE cspa_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cspa_call_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cspa_imports
CREATE POLICY "Users can view their own imports" ON cspa_imports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imports" ON cspa_imports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imports" ON cspa_imports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imports" ON cspa_imports
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cspa_call_analytics
CREATE POLICY "Users can view analytics for their imports" ON cspa_call_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cspa_imports 
            WHERE cspa_imports.id = cspa_call_analytics.import_id 
            AND cspa_imports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert analytics for their imports" ON cspa_call_analytics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cspa_imports 
            WHERE cspa_imports.id = cspa_call_analytics.import_id 
            AND cspa_imports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update analytics for their imports" ON cspa_call_analytics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cspa_imports 
            WHERE cspa_imports.id = cspa_call_analytics.import_id 
            AND cspa_imports.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete analytics for their imports" ON cspa_call_analytics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM cspa_imports 
            WHERE cspa_imports.id = cspa_call_analytics.import_id 
            AND cspa_imports.user_id = auth.uid()
        )
    );

-- Create a view for easier querying of import data with analytics
CREATE OR REPLACE VIEW cspa_imports_with_analytics AS
SELECT 
    i.*,
    ca.direction_distribution,
    ca.call_result_distribution,
    ca.agent_distribution,
    ca.queue_distribution,
    ca.avg_talk_time,
    ca.avg_time_in_queue,
    ca.avg_on_hold_duration,
    ca.total_calls,
    ca.inbound_calls,
    ca.outbound_calls,
    ca.abandoned_calls,
    ca.lost_in_ivr_calls,
    ca.avg_survey_rating,
    ca.repeat_call_rate,
    ca.agent_performance
FROM cspa_imports i
LEFT JOIN cspa_call_analytics ca ON i.id = ca.import_id
WHERE i.status = 'active';

-- Grant necessary permissions
GRANT ALL ON cspa_imports TO authenticated;
GRANT ALL ON cspa_call_analytics TO authenticated;
GRANT SELECT ON cspa_imports_with_analytics TO authenticated;

-- Create a function to get import statistics
CREATE OR REPLACE FUNCTION get_cspa_user_stats(user_uuid UUID)
RETURNS TABLE(
    total_imports BIGINT,
    total_calls BIGINT,
    total_tickets BIGINT,
    latest_import_date TIMESTAMP WITH TIME ZONE,
    data_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_imports,
        COALESCE(SUM(CASE WHEN i.data_type = 'callCenter' THEN i.file_size ELSE 0 END), 0)::BIGINT as total_calls,
        COALESCE(SUM(CASE WHEN i.data_type = 'ticket' THEN i.file_size ELSE 0 END), 0)::BIGINT as total_tickets,
        MAX(i.import_date) as latest_import_date,
        ARRAY_AGG(DISTINCT i.data_type) as data_types
    FROM cspa_imports i
    WHERE i.user_id = user_uuid AND i.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_cspa_user_stats(UUID) TO authenticated;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO cspa_imports (user_id, file_name, file_size, data_type, processed_data, analytics, summary)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
--     'sample_call_data.csv',
--     100,
--     'callCenter',
--     '{"sample": "data"}'::jsonb,
--     '{"sample": "analytics"}'::jsonb,
--     '{"sample": "summary"}'::jsonb
-- );

-- Create comments for documentation
COMMENT ON TABLE cspa_imports IS 'Stores imported CSV data files and their metadata';
COMMENT ON TABLE cspa_call_analytics IS 'Stores processed call center analytics for better performance';
COMMENT ON VIEW cspa_imports_with_analytics IS 'Combined view of imports and their analytics';
COMMENT ON FUNCTION get_cspa_user_stats(UUID) IS 'Returns statistics for a specific user';

-- Display success message
SELECT 'CSPA database setup completed successfully!' as status;

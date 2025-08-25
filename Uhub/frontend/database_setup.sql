-- Calendar Events Table Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Create the calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) DEFAULT 'event' CHECK (type IN ('meeting', 'deadline', 'reminder', 'event', 'task')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    location VARCHAR(255),
    category VARCHAR(100) DEFAULT 'Work',
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    department VARCHAR(100) DEFAULT 'General',
    attendees TEXT[] DEFAULT '{}',
    is_all_day BOOLEAN DEFAULT FALSE,
    recurrence JSONB,
    reminder_time INTEGER DEFAULT 15, -- minutes before event
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON calendar_events(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_department ON calendar_events(department);

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy 1: Users can view their own events
CREATE POLICY "Users can view own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own events
CREATE POLICY "Users can insert own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own events
CREATE POLICY "Users can update own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own events
CREATE POLICY "Users can delete own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Policy 5: Admins can view all events (you'll need to create an admin role function)
CREATE POLICY "Admins can view all events" ON calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role = 'admin'
        )
    );

-- Policy 6: Admins can manage all events
CREATE POLICY "Admins can manage all events" ON calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role = 'admin'
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional - for testing)
INSERT INTO calendar_events (
    title, 
    description, 
    start_date, 
    end_date, 
    type, 
    priority, 
    location, 
    category, 
    user_id,
    department
) VALUES 
(
    'Team Meeting',
    'Weekly team sync meeting to discuss project progress',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    'meeting',
    'high',
    'Conference Room A',
    'Work',
    (SELECT id FROM auth.users LIMIT 1),
    'IT'
),
(
    'Project Deadline',
    'Submit final project documentation',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days',
    'deadline',
    'high',
    NULL,
    'Work',
    (SELECT id FROM auth.users LIMIT 1),
    'IT'
),
(
    'Client Presentation',
    'Present quarterly results to client',
    NOW() + INTERVAL '1 week',
    NOW() + INTERVAL '1 week' + INTERVAL '2 hours',
    'event',
    'medium',
    'Client Office',
    'Work',
    (SELECT id FROM auth.users LIMIT 1),
    'Sales'
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON calendar_events TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create a view for upcoming events (optional)
CREATE OR REPLACE VIEW upcoming_events AS
SELECT 
    id,
    title,
    description,
    start_date,
    end_date,
    type,
    priority,
    location,
    category,
    status,
    user_id,
    department,
    attendees,
    is_all_day,
    reminder_time
FROM calendar_events 
WHERE start_date >= NOW() 
AND status != 'cancelled'
ORDER BY start_date ASC;

-- Grant access to the view
GRANT SELECT ON upcoming_events TO authenticated;

-- Create a function to get events by date range
CREATE OR REPLACE FUNCTION get_events_by_date_range(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    type VARCHAR(50),
    priority VARCHAR(20),
    location VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(50),
    user_id UUID,
    department VARCHAR(100),
    attendees TEXT[],
    is_all_day BOOLEAN,
    reminder_time INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.start_date,
        ce.end_date,
        ce.type,
        ce.priority,
        ce.location,
        ce.category,
        ce.status,
        ce.user_id,
        ce.department,
        ce.attendees,
        ce.is_all_day,
        ce.reminder_time,
        ce.created_at,
        ce.updated_at
    FROM calendar_events ce
    WHERE ce.user_id = p_user_id
    AND ce.start_date >= p_start_date
    AND ce.end_date <= p_end_date
    ORDER BY ce.start_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_events_by_date_range(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE calendar_events IS 'Stores calendar events, meetings, deadlines, and tasks for users';
COMMENT ON COLUMN calendar_events.type IS 'Type of event: meeting, deadline, reminder, event, or task';
COMMENT ON COLUMN calendar_events.priority IS 'Priority level: low, medium, or high';
COMMENT ON COLUMN calendar_events.status IS 'Current status: upcoming, in_progress, completed, or cancelled';
COMMENT ON COLUMN calendar_events.attendees IS 'Array of attendee email addresses';
COMMENT ON COLUMN calendar_events.reminder_time IS 'Minutes before event to send reminder (0 = no reminder)';
COMMENT ON COLUMN calendar_events.recurrence IS 'JSON object for recurring event settings';

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Calendar events table setup completed successfully!';
    RAISE NOTICE 'Table: calendar_events';
    RAISE NOTICE 'View: upcoming_events';
    RAISE NOTICE 'Function: get_events_by_date_range()';
    RAISE NOTICE 'RLS policies created for security';
END $$;

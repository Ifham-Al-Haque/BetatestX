-- Slice of Life Database Schema
-- This script creates tables for Events, Memories, and Image Uploads

-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    attendees_count INTEGER DEFAULT 0,
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Memories Table
CREATE TABLE IF NOT EXISTS memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    memory_date DATE NOT NULL,
    location VARCHAR(255),
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    tags TEXT[], -- Array of tags
    likes_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Event Images Table
CREATE TABLE IF NOT EXISTS event_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_size INTEGER NOT NULL, -- Size in bytes
    file_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL, -- Supabase storage path
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- Primary image for event/memory
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Memory Attendees Table (for tracking who was at events)
CREATE TABLE IF NOT EXISTS memory_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(memory_id, user_id)
);

-- 5. Create Image Likes Table
CREATE TABLE IF NOT EXISTS image_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_id UUID NOT NULL REFERENCES event_images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(image_id, user_id)
);

-- 6. Create Image Favorites Table
CREATE TABLE IF NOT EXISTS image_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_id UUID NOT NULL REFERENCES event_images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(image_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Events
CREATE POLICY "Users can view all events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update all events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "Users can delete own events" ON events
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all events" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager')
        )
    );

-- Create RLS Policies for Memories
CREATE POLICY "Users can view all memories" ON memories
    FOR SELECT USING (true);

CREATE POLICY "Users can create memories" ON memories
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own memories" ON memories
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update all memories" ON memories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "Users can delete own memories" ON memories
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all memories" ON memories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager')
        )
    );

-- Create RLS Policies for Event Images
CREATE POLICY "Users can view all event images" ON event_images
    FOR SELECT USING (true);

CREATE POLICY "Users can create event images" ON event_images
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own event images" ON event_images
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can update all event images" ON event_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'manager')
        )
    );

CREATE POLICY "Users can delete own event images" ON event_images
    FOR DELETE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can delete all event images" ON event_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager')
        )
    );

-- Create RLS Policies for Memory Attendees
CREATE POLICY "Users can view all memory attendees" ON memory_attendees
    FOR SELECT USING (true);

CREATE POLICY "Users can manage memory attendees" ON memory_attendees
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM memories 
            WHERE memories.id = memory_id 
            AND memories.created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'manager')
        )
    );

-- Create RLS Policies for Image Likes
CREATE POLICY "Users can view all image likes" ON image_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own image likes" ON image_likes
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS Policies for Image Favorites
CREATE POLICY "Users can view all image favorites" ON image_favorites
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own image favorites" ON image_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

CREATE INDEX IF NOT EXISTS idx_memories_created_by ON memories(created_by);
CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON memories(memory_date);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_memories_is_favorite ON memories(is_favorite);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_memory_id ON event_images(memory_id);
CREATE INDEX IF NOT EXISTS idx_event_images_uploaded_by ON event_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_images_is_primary ON event_images(is_primary);

CREATE INDEX IF NOT EXISTS idx_memory_attendees_memory_id ON memory_attendees(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_attendees_user_id ON memory_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_image_likes_image_id ON image_likes(image_id);
CREATE INDEX IF NOT EXISTS idx_image_likes_user_id ON image_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_image_favorites_image_id ON image_favorites(image_id);
CREATE INDEX IF NOT EXISTS idx_image_favorites_user_id ON image_favorites(user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get event statistics
CREATE OR REPLACE FUNCTION get_event_statistics()
RETURNS TABLE (
    total_events BIGINT,
    upcoming_events BIGINT,
    completed_events BIGINT,
    cancelled_events BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming_events,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_events,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_events
    FROM events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get memory statistics
CREATE OR REPLACE FUNCTION get_memory_statistics()
RETURNS TABLE (
    total_memories BIGINT,
    favorite_memories BIGINT,
    recent_memories BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memories,
        COUNT(*) FILTER (WHERE is_favorite = true) as favorite_memories,
        COUNT(*) FILTER (WHERE memory_date >= CURRENT_DATE - INTERVAL '30 days') as recent_memories
    FROM memories;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON events TO authenticated;
GRANT ALL ON memories TO authenticated;
GRANT ALL ON event_images TO authenticated;
GRANT ALL ON memory_attendees TO authenticated;
GRANT ALL ON image_likes TO authenticated;
GRANT ALL ON image_favorites TO authenticated;

GRANT EXECUTE ON FUNCTION get_event_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_statistics() TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE events IS 'Company events and activities';
COMMENT ON TABLE memories IS 'Company memories and special moments';
COMMENT ON TABLE event_images IS 'Images associated with events and memories';
COMMENT ON TABLE memory_attendees IS 'People who attended specific memories/events';
COMMENT ON TABLE image_likes IS 'User likes on event/memory images';
COMMENT ON TABLE image_favorites IS 'User favorites for event/memory images';

-- Insert sample data
INSERT INTO events (title, description, event_date, event_time, location, attendees_count, category, status, created_by) VALUES
('Team Building Workshop 2024', 'Annual team building event to strengthen collaboration and team spirit', '2024-03-15', '09:00:00', 'Conference Room A', 25, 'Workshop', 'upcoming', (SELECT id FROM auth.users LIMIT 1)),
('Company Anniversary Celebration', 'Celebrating 5 years of success and growth', '2024-04-20', '18:00:00', 'Grand Hall', 100, 'Celebration', 'upcoming', (SELECT id FROM auth.users LIMIT 1)),
('Tech Innovation Day', 'Showcasing latest technological innovations and projects', '2024-02-28', '10:00:00', 'Innovation Center', 50, 'Conference', 'completed', (SELECT id FROM auth.users LIMIT 1));

INSERT INTO memories (title, description, memory_date, location, category, tags, created_by) VALUES
('Team Building Workshop 2024', 'Amazing day filled with laughter, challenges, and team bonding activities. Everyone worked together to solve puzzles and build stronger relationships.', '2024-01-15', 'Conference Room A', 'Workshop', ARRAY['Team Building', 'Workshop', 'Fun'], (SELECT id FROM auth.users LIMIT 1)),
('Company Anniversary Celebration', 'Celebrating 5 years of success! The evening was filled with joy, recognition, and looking forward to many more years of growth.', '2024-01-20', 'Grand Hall', 'Celebration', ARRAY['Anniversary', 'Celebration', 'Success'], (SELECT id FROM auth.users LIMIT 1)),
('Tech Innovation Day', 'Showcasing the latest technological innovations and projects. Great to see the creativity and technical expertise of our team.', '2024-01-25', 'Innovation Center', 'Conference', ARRAY['Technology', 'Innovation', 'Projects'], (SELECT id FROM auth.users LIMIT 1));

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Slice of Life database schema created successfully!';
    RAISE NOTICE 'Tables created: events, memories, event_images, memory_attendees, image_likes, image_favorites';
    RAISE NOTICE 'RLS policies and indexes have been set up';
    RAISE NOTICE 'Sample data has been inserted';
END $$;

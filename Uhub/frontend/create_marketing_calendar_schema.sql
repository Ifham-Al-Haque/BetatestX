-- Marketing Calendar System - Complete Database Schema
-- This script creates a comprehensive marketing calendar system with events and comments
-- Run this in your Supabase SQL editor

-- 1. Create Marketing Event Categories table
CREATE TABLE IF NOT EXISTS marketing_event_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for calendar display
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Marketing Calendar Events table
CREATE TABLE IF NOT EXISTS marketing_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    category_id UUID REFERENCES marketing_event_categories(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(auth_user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_all_day BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_end_date DATE,
    location VARCHAR(255),
    attendees TEXT[], -- Array of email addresses or user IDs
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}'
);

-- 3. Create Event Comments table for collaboration
CREATE TABLE IF NOT EXISTS marketing_event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES marketing_calendar_events(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by UUID REFERENCES users(auth_user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    parent_comment_id UUID REFERENCES marketing_event_comments(id) ON DELETE CASCADE, -- For threaded comments
    metadata JSONB DEFAULT '{}'
);

-- 4. Create Event Attachments table (for files, images, etc.)
CREATE TABLE IF NOT EXISTS marketing_event_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES marketing_calendar_events(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- 5. Create Event Participants table (for tracking who's involved)
CREATE TABLE IF NOT EXISTS marketing_event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES marketing_calendar_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('organizer', 'participant', 'viewer')),
    status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'maybe')),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE marketing_event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_event_participants ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for marketing_event_categories
DROP POLICY IF EXISTS "Marketing team can view all categories" ON marketing_event_categories;
CREATE POLICY "Marketing team can view all categories" ON marketing_event_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can manage categories" ON marketing_event_categories;
CREATE POLICY "Marketing team can manage categories" ON marketing_event_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

-- 8. Create RLS Policies for marketing_calendar_events
DROP POLICY IF EXISTS "Marketing team can view all events" ON marketing_calendar_events;
CREATE POLICY "Marketing team can view all events" ON marketing_calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can create events" ON marketing_calendar_events;
CREATE POLICY "Marketing team can create events" ON marketing_calendar_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can update events" ON marketing_calendar_events;
CREATE POLICY "Marketing team can update events" ON marketing_calendar_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can delete events" ON marketing_calendar_events;
CREATE POLICY "Marketing team can delete events" ON marketing_calendar_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

-- 9. Create RLS Policies for marketing_event_comments
DROP POLICY IF EXISTS "Marketing team can view all comments" ON marketing_event_comments;
CREATE POLICY "Marketing team can view all comments" ON marketing_event_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can create comments" ON marketing_event_comments;
CREATE POLICY "Marketing team can create comments" ON marketing_event_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Users can update their own comments" ON marketing_event_comments;
CREATE POLICY "Users can update their own comments" ON marketing_event_comments
    FOR UPDATE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Users can delete their own comments" ON marketing_event_comments;
CREATE POLICY "Users can delete their own comments" ON marketing_event_comments
    FOR DELETE USING (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- 10. Create RLS Policies for marketing_event_attachments
DROP POLICY IF EXISTS "Marketing team can view all attachments" ON marketing_event_attachments;
CREATE POLICY "Marketing team can view all attachments" ON marketing_event_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can manage attachments" ON marketing_event_attachments;
CREATE POLICY "Marketing team can manage attachments" ON marketing_event_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- 11. Create RLS Policies for marketing_event_participants
DROP POLICY IF EXISTS "Marketing team can view all participants" ON marketing_event_participants;
CREATE POLICY "Marketing team can view all participants" ON marketing_event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can manage participants" ON marketing_event_participants;
CREATE POLICY "Marketing team can manage participants" ON marketing_event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

-- 12. Insert default marketing event categories
INSERT INTO marketing_event_categories (name, description, color, icon) VALUES
('Campaign Launch', 'New marketing campaigns and product launches', '#EF4444', 'rocket'),
('Social Media', 'Social media posts, campaigns, and content creation', '#3B82F6', 'share-2'),
('Email Marketing', 'Email campaigns and newsletters', '#10B981', 'mail'),
('Content Creation', 'Blog posts, articles, videos, and other content', '#F59E0B', 'edit-3'),
('SEO & Analytics', 'SEO optimization and analytics reviews', '#8B5CF6', 'bar-chart-2'),
('Events & Webinars', 'Live events, webinars, and conferences', '#EC4899', 'calendar'),
('Partnerships', 'Partnership announcements and collaborations', '#06B6D4', 'users'),
('PR & Media', 'Press releases and media outreach', '#84CC16', 'megaphone'),
('Research & Planning', 'Market research and strategy planning', '#F97316', 'search'),
('Other', 'Other marketing activities', '#6B7280', 'more-horizontal')
ON CONFLICT (name) DO NOTHING;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_events_date ON marketing_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_marketing_events_category ON marketing_calendar_events(category_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_created_by ON marketing_calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_events_status ON marketing_calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_marketing_comments_event ON marketing_event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_marketing_comments_created_by ON marketing_event_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_participants_event ON marketing_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_marketing_participants_user ON marketing_event_participants(user_id);

-- 14. Create RPC functions for common operations
CREATE OR REPLACE FUNCTION get_marketing_events_for_date_range(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN,
    location VARCHAR(255),
    status VARCHAR(20),
    priority VARCHAR(10),
    category_name VARCHAR(100),
    category_color VARCHAR(7),
    category_icon VARCHAR(50),
    created_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    comment_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.start_time,
        e.end_time,
        e.is_all_day,
        e.location,
        e.status,
        e.priority,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        up.full_name as created_by_name,
        e.created_at,
        COALESCE(comment_stats.comment_count, 0) as comment_count
    FROM marketing_calendar_events e
    LEFT JOIN marketing_event_categories c ON e.category_id = c.id
    LEFT JOIN users up ON e.created_by = up.id
    LEFT JOIN (
        SELECT 
            event_id, 
            COUNT(*) as comment_count 
        FROM marketing_event_comments 
        GROUP BY event_id
    ) comment_stats ON e.id = comment_stats.event_id
    WHERE e.event_date BETWEEN start_date AND end_date
    ORDER BY e.event_date, e.start_time;
END;
$$;

-- 15. Create function to get event with comments
CREATE OR REPLACE FUNCTION get_marketing_event_with_comments(p_event_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR(255),
    description TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN,
    location VARCHAR(255),
    status VARCHAR(20),
    priority VARCHAR(10),
    category_name VARCHAR(100),
    category_color VARCHAR(7),
    category_icon VARCHAR(50),
    created_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    comment_id UUID,
    comment_text TEXT,
    comment_created_by_name VARCHAR(255),
    comment_created_at TIMESTAMP WITH TIME ZONE,
    comment_is_edited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as event_id,
        e.title,
        e.description,
        e.event_date,
        e.start_time,
        e.end_time,
        e.is_all_day,
        e.location,
        e.status,
        e.priority,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        up.full_name as created_by_name,
        e.created_at,
        com.id as comment_id,
        com.comment as comment_text,
        up_comment.full_name as comment_created_by_name,
        com.created_at as comment_created_at,
        com.is_edited
    FROM marketing_calendar_events e
    LEFT JOIN marketing_event_categories c ON e.category_id = c.id
    LEFT JOIN users up ON e.created_by = up.id
    LEFT JOIN marketing_event_comments com ON e.id = com.event_id
    LEFT JOIN users up_comment ON com.created_by = up_comment.id
    WHERE e.id = p_event_id
    ORDER BY com.created_at ASC;
END;
$$;

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 17. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketing_categories_updated_at
    BEFORE UPDATE ON marketing_event_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_events_updated_at
    BEFORE UPDATE ON marketing_calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_comments_updated_at
    BEFORE UPDATE ON marketing_event_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 18. Insert sample marketing events for testing
INSERT INTO marketing_calendar_events (title, description, event_date, start_time, end_time, category_id, created_by, is_all_day, location, status, priority)
SELECT 
    'Q1 Product Launch Campaign',
    'Launch of new product line with comprehensive marketing campaign',
    CURRENT_DATE + INTERVAL '7 days',
    '09:00:00',
    '17:00:00',
    (SELECT id FROM marketing_event_categories WHERE name = 'Campaign Launch'),
    (SELECT id FROM auth.users LIMIT 1),
    false,
    'Marketing Office',
    'scheduled',
    'high'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

INSERT INTO marketing_calendar_events (title, description, event_date, start_time, end_time, category_id, created_by, is_all_day, location, status, priority)
SELECT 
    'Social Media Content Planning',
    'Weekly planning session for social media content',
    CURRENT_DATE + INTERVAL '3 days',
    '14:00:00',
    '16:00:00',
    (SELECT id FROM marketing_event_categories WHERE name = 'Social Media'),
    (SELECT id FROM auth.users LIMIT 1),
    false,
    'Conference Room A',
    'scheduled',
    'medium'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Marketing Calendar System created successfully!';
    RAISE NOTICE 'Default categories and sample events have been inserted.';
    RAISE NOTICE 'Remember to create marketing role users to access the calendar.';
END $$;

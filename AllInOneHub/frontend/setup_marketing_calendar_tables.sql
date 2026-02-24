-- Marketing Calendar Tables Setup
-- Run this in your Supabase SQL Editor to create the required tables

-- 1. Create Marketing Event Categories table
CREATE TABLE IF NOT EXISTS marketing_event_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
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
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}'
);

-- Add explicit foreign key constraint names for better Supabase integration
DO $$
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'marketing_calendar_events_created_by_fkey') THEN
        ALTER TABLE marketing_calendar_events DROP CONSTRAINT marketing_calendar_events_created_by_fkey;
    END IF;
    
    -- Add the constraint with explicit name
    ALTER TABLE marketing_calendar_events 
    ADD CONSTRAINT marketing_calendar_events_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(auth_user_id) ON DELETE SET NULL;
END $$;

-- 3. Create Event Comments table
CREATE TABLE IF NOT EXISTS marketing_event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES marketing_calendar_events(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by UUID REFERENCES users(auth_user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false
);

-- Add explicit foreign key constraint names for comments table
DO $$
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'marketing_event_comments_created_by_fkey') THEN
        ALTER TABLE marketing_event_comments DROP CONSTRAINT marketing_event_comments_created_by_fkey;
    END IF;
    
    -- Add the constraint with explicit name
    ALTER TABLE marketing_event_comments 
    ADD CONSTRAINT marketing_event_comments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(auth_user_id) ON DELETE SET NULL;
END $$;

-- 4. Enable Row Level Security
ALTER TABLE marketing_event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_event_comments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Marketing Event Categories
DROP POLICY IF EXISTS "Marketing team can view all categories" ON marketing_event_categories;
CREATE POLICY "Marketing team can view all categories" ON marketing_event_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'marketing_manager', 'marketing_specialist', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can create categories" ON marketing_event_categories;
CREATE POLICY "Marketing team can create categories" ON marketing_event_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Marketing team can update categories" ON marketing_event_categories;
CREATE POLICY "Marketing team can update categories" ON marketing_event_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

-- 6. Create RLS Policies for Marketing Calendar Events
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

-- 7. Create RLS Policies for Marketing Event Comments
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

DROP POLICY IF EXISTS "Users can update own comments" ON marketing_event_comments;
CREATE POLICY "Users can update own comments" ON marketing_event_comments
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

DROP POLICY IF EXISTS "Users can delete own comments" ON marketing_event_comments;
CREATE POLICY "Users can delete own comments" ON marketing_event_comments
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'marketing_manager', 'marketing_management')
        )
    );

-- 8. Insert some default categories
INSERT INTO marketing_event_categories (name, description, color, icon) VALUES
('Campaign Launch', 'Product or service campaign launches', '#FF6B6B', 'rocket'),
('Content Creation', 'Content development and creation activities', '#4ECDC4', 'edit'),
('Social Media', 'Social media campaigns and activities', '#45B7D1', 'share'),
('Email Marketing', 'Email campaigns and newsletters', '#96CEB4', 'mail'),
('Analytics', 'Data analysis and reporting', '#FFEAA7', 'bar-chart'),
('Meeting', 'Team meetings and planning sessions', '#DDA0DD', 'users')
ON CONFLICT (name) DO NOTHING;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_calendar_events_date ON marketing_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_marketing_calendar_events_created_by ON marketing_calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_calendar_events_category ON marketing_calendar_events(category_id);
CREATE INDEX IF NOT EXISTS idx_marketing_event_comments_event_id ON marketing_event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_marketing_event_comments_created_by ON marketing_event_comments(created_by);

-- Success message
SELECT '✅ Marketing Calendar tables created successfully!' as status;

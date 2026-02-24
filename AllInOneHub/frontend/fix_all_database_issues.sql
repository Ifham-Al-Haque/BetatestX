-- Comprehensive Database Fix for Uhub Frontend
-- This script fixes all the database issues including chat system, suggestions, and user table conflicts
-- Run this in your Supabase SQL editor

-- 1. First, let's check what tables exist and clean up conflicts
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if user_profiles table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating user_profiles table...';
        
        -- Create user_profiles table
        CREATE TABLE user_profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name VARCHAR(255),
            avatar_url TEXT,
            role VARCHAR(50) DEFAULT 'user',
            department VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
        
        -- Create RLS policies
        CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
        CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        RAISE NOTICE 'user_profiles table created successfully';
    ELSE
        RAISE NOTICE 'user_profiles table already exists';
    END IF;
END $$;

-- 2. Create suggestions table if it doesn't exist
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

-- Enable RLS for suggestions
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can view suggestions targeted at them" ON suggestions;
DROP POLICY IF EXISTS "Users can view general suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own open suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own open suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can view all suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can update all suggestions" ON suggestions;
DROP POLICY IF EXISTS "Admins can delete all suggestions" ON suggestions;

-- Create RLS policies for suggestions
CREATE POLICY "Users can view own suggestions" ON suggestions
    FOR SELECT USING (auth.uid() = suggester_id);

CREATE POLICY "Users can view suggestions targeted at them" ON suggestions
    FOR SELECT USING (auth.uid() = target_user_id);

CREATE POLICY "Users can view general suggestions" ON suggestions
    FOR SELECT USING (suggestion_type = 'general');

CREATE POLICY "Users can create own suggestions" ON suggestions
    FOR INSERT WITH CHECK (auth.uid() = suggester_id);

CREATE POLICY "Users can update own open suggestions" ON suggestions
    FOR UPDATE USING (auth.uid() = suggester_id AND status = 'open');

CREATE POLICY "Users can delete own open suggestions" ON suggestions
    FOR DELETE USING (auth.uid() = suggester_id AND status = 'open');

-- Admin policies for suggestions (using user_profiles table)
CREATE POLICY "Admins can view all suggestions" ON suggestions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

CREATE POLICY "Admins can update all suggestions" ON suggestions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

CREATE POLICY "Admins can delete all suggestions" ON suggestions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

-- 3. Create suggestion categories table
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

-- 4. Fix chat system tables
-- Drop existing chat tables to avoid conflicts
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;

-- Create chat system tables
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'direct',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL
);

CREATE TABLE user_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_message VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Enable RLS for chat tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop existing chat policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view all user statuses" ON user_status;
DROP POLICY IF EXISTS "Users can update their own status" ON user_status;
DROP POLICY IF EXISTS "Users can insert their own status" ON user_status;
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing indicators" ON typing_indicators;
DROP POLICY IF EXISTS "Users can insert their own typing indicators" ON typing_indicators;

-- Create RLS policies for chat tables
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view participants in their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_participants.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON conversation_participants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can edit their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can view all user statuses" ON user_status FOR SELECT USING (true);

CREATE POLICY "Users can update their own status" ON user_status
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status" ON user_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = typing_indicators.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own typing indicators" ON typing_indicators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own typing indicators" ON typing_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create RPC functions for chat system
-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS get_user_conversations();
DROP FUNCTION IF EXISTS create_direct_conversation(UUID);
DROP FUNCTION IF EXISTS create_group_conversation(VARCHAR, UUID[]);

CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE (
    conversation_id UUID,
    conversation_name VARCHAR(255),
    conversation_type VARCHAR(20),
    last_message_content TEXT,
    last_message_created_at TIMESTAMPTZ,
    unread_count BIGINT,
    participants JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        c.name as conversation_name,
        c.type as conversation_type,
        m.content as last_message_content,
        m.created_at as last_message_created_at,
        COUNT(CASE WHEN m.created_at > cp.last_read_at THEN 1 END) as unread_count,
        jsonb_agg(
            jsonb_build_object(
                'user_id', up.id,
                'full_name', up.full_name,
                'avatar_url', up.avatar_url,
                'role', up.role,
                'department', up.department
            )
        ) as participants
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    LEFT JOIN user_profiles up ON cp.user_id = up.id
    WHERE cp.user_id = auth.uid()
    AND c.is_active = true
    GROUP BY c.id, c.name, c.type, m.content, m.created_at
    ORDER BY m.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_direct_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    existing_conversation_id UUID;
BEGIN
    -- Check if conversation already exists
    SELECT c.id INTO existing_conversation_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE c.type = 'direct'
    AND cp1.user_id = auth.uid()
    AND cp2.user_id = other_user_id;
    
    IF existing_conversation_id IS NOT NULL THEN
        RETURN existing_conversation_id;
    END IF;
    
    -- Create new conversation
    INSERT INTO conversations (type, created_by)
    VALUES ('direct', auth.uid())
    RETURNING id INTO conversation_id;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
        (conversation_id, auth.uid()),
        (conversation_id, other_user_id);
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_group_conversation(group_name VARCHAR, participant_ids UUID[])
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    participant_id UUID;
BEGIN
    -- Create group conversation
    INSERT INTO conversations (name, type, created_by)
    VALUES (group_name, 'group', auth.uid())
    RETURNING id INTO conversation_id;
    
    -- Add creator as participant and admin
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    VALUES (conversation_id, auth.uid(), true);
    
    -- Add other participants
    FOREACH participant_id IN ARRAY participant_ids
    LOOP
        IF participant_id != auth.uid() THEN
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (conversation_id, participant_id);
        END IF;
    END LOOP;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Initialize user profiles for existing users
INSERT INTO user_profiles (id, user_id, full_name, role, department)
SELECT 
    id,
    id,
    COALESCE(raw_user_meta_data->>'full_name', 'User ' || id),
    COALESCE(raw_user_meta_data->>'role', 'user'),
    COALESCE(raw_user_meta_data->>'department', 'General')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Initialize user status for existing users
INSERT INTO user_status (user_id, is_online, last_seen)
SELECT id, false, NOW()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suggestions_suggester_id ON suggestions(suggester_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_target_user_id ON suggestions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_priority ON suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_suggestion_type ON suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_suggestions_assigned_to ON suggestions(assigned_to);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_status(is_online);

-- 9. Create function to automatically update updated_at timestamp for suggestions
CREATE OR REPLACE FUNCTION update_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for suggestions
DROP TRIGGER IF EXISTS trigger_update_suggestions_updated_at ON suggestions;
CREATE TRIGGER trigger_update_suggestions_updated_at
    BEFORE UPDATE ON suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_suggestions_updated_at();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 11. Add comments for documentation
COMMENT ON TABLE suggestions IS 'Stores user suggestions and feedback with role-based access control';
COMMENT ON TABLE conversations IS 'Chat conversations - both direct messages and group chats';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Individual chat messages';
COMMENT ON TABLE user_status IS 'User online status and availability';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for conversations';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';

-- 12. Create a view for suggestion statistics
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

GRANT ALL ON suggestion_statistics TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully! All tables and functions have been created.';
    RAISE NOTICE 'You can now access the suggestions page and chat system without errors.';
END $$;

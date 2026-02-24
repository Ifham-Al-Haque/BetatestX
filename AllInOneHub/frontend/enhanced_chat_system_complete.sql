-- Enhanced Chat System Complete Implementation
-- This script creates a fully functional chat system with team/group messaging
-- Run this in your Supabase SQL editor

-- 1. Clean up existing chat tables to avoid conflicts
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;

-- 2. Create enhanced chat system tables
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'team')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table for organizational structure
CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Team members table
CREATE TABLE team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- Conversation participants with enhanced features
CREATE TABLE conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

-- Messages table with enhanced features
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User status table
CREATE TABLE user_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_message VARCHAR(255),
    custom_status VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing indicators
CREATE TABLE typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Message reactions
CREATE TABLE message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- File attachments
CREATE TABLE file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Conversations policies
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

CREATE POLICY "Users can update conversations they created" ON conversations
    FOR UPDATE USING (auth.uid() = created_by);

-- Teams policies
CREATE POLICY "Users can view all active teams" ON teams
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update teams" ON teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_id = teams.id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Team members policies
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team admins can manage team members" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('admin', 'moderator')
        )
    );

-- Conversation participants policies
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

-- Messages policies
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

-- User status policies
CREATE POLICY "Users can view all user statuses" ON user_status FOR SELECT USING (true);
CREATE POLICY "Users can update their own status" ON user_status
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own status" ON user_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Typing indicators policies
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = typing_indicators.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (auth.uid() = user_id);

-- Message reactions policies
CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_reactions.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages" ON message_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" ON message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- File attachments policies
CREATE POLICY "Users can view attachments in their conversations" ON file_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = file_attachments.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload attachments to their conversations" ON file_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE m.id = file_attachments.message_id
            AND cp.user_id = auth.uid()
        )
    );

-- 5. Create enhanced RPC functions

-- Function to get all available users for chat
CREATE OR REPLACE FUNCTION get_available_users_for_chat()
RETURNS TABLE (
    user_id UUID,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50),
    department VARCHAR(100),
    is_online BOOLEAN,
    last_seen TIMESTAMPTZ,
    status_message VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as user_id,
        up.full_name,
        up.avatar_url,
        up.role,
        up.department,
        COALESCE(us.is_online, false) as is_online,
        us.last_seen,
        us.status_message
    FROM user_profiles up
    LEFT JOIN user_status us ON up.id = us.user_id
    WHERE up.id != auth.uid()  -- Exclude current user
    AND up.id IS NOT NULL
    ORDER BY 
        us.is_online DESC NULLS LAST,
        us.last_seen DESC NULLS LAST,
        up.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user conversations with enhanced details
CREATE OR REPLACE FUNCTION get_user_conversations_enhanced()
RETURNS TABLE (
    conversation_id UUID,
    conversation_name VARCHAR(255),
    conversation_type VARCHAR(20),
    last_message_content TEXT,
    last_message_created_at TIMESTAMPTZ,
    last_message_sender_name VARCHAR(255),
    unread_count BIGINT,
    participants JSONB,
    participant_count INTEGER,
    is_team_chat BOOLEAN,
    team_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        c.name as conversation_name,
        c.type as conversation_type,
        m.content as last_message_content,
        m.created_at as last_message_created_at,
        up.full_name as last_message_sender_name,
        COUNT(CASE WHEN m.created_at > cp.last_read_at THEN 1 END) as unread_count,
        jsonb_agg(
            jsonb_build_object(
                'user_id', up.id,
                'full_name', up.full_name,
                'avatar_url', up.avatar_url,
                'role', up.role,
                'department', up.department,
                'is_online', COALESCE(us.is_online, false)
            )
        ) as participants,
        COUNT(DISTINCT cp.user_id) as participant_count,
        c.type IN ('group', 'team') as is_team_chat,
        CASE 
            WHEN c.type = 'team' THEN t.name
            ELSE NULL
        END as team_name
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    LEFT JOIN user_profiles up ON cp.user_id = up.id
    LEFT JOIN user_status us ON cp.user_id = us.user_id
    LEFT JOIN teams t ON c.metadata->>'team_id' = t.id::text
    WHERE cp.user_id = auth.uid()
    AND c.is_active = true
    GROUP BY c.id, c.name, c.type, m.content, m.created_at, up.full_name, t.name
    ORDER BY m.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create direct conversation
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

-- Function to create team conversation
CREATE OR REPLACE FUNCTION create_team_conversation(team_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    existing_conversation_id UUID;
    team_name VARCHAR(255);
BEGIN
    -- Get team name
    SELECT name INTO team_name FROM teams WHERE id = team_id;
    
    -- Check if conversation already exists for this team
    SELECT c.id INTO existing_conversation_id
    FROM conversations c
    WHERE c.type = 'team' 
    AND c.metadata->>'team_id' = team_id::text;
    
    IF existing_conversation_id IS NOT NULL THEN
        RETURN existing_conversation_id;
    END IF;
    
    -- Create new team conversation
    INSERT INTO conversations (name, type, created_by, metadata)
    VALUES (team_name, 'team', auth.uid(), jsonb_build_object('team_id', team_id))
    RETURNING id INTO conversation_id;
    
    -- Add all team members as participants
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    SELECT 
        conversation_id,
        tm.user_id,
        tm.role = 'admin'
    FROM team_members tm
    WHERE tm.team_id = team_id
    AND tm.is_active = true;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create group conversation
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

-- Function to get team members
CREATE OR REPLACE FUNCTION get_team_members(team_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50),
    department VARCHAR(100),
    team_role VARCHAR(50),
    is_online BOOLEAN,
    last_seen TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.user_id,
        up.full_name,
        up.avatar_url,
        up.role,
        up.department,
        tm.role as team_role,
        COALESCE(us.is_online, false) as is_online,
        us.last_seen
    FROM team_members tm
    JOIN user_profiles up ON tm.user_id = up.id
    LEFT JOIN user_status us ON tm.user_id = us.user_id
    WHERE tm.team_id = team_id
    AND tm.is_active = true
    ORDER BY 
        tm.role DESC,
        us.is_online DESC NULLS LAST,
        up.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add user to team
CREATE OR REPLACE FUNCTION add_user_to_team(team_id UUID, user_id UUID, team_role VARCHAR DEFAULT 'member')
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is team admin
    IF NOT EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = add_user_to_team.team_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only team admins can add members';
    END IF;
    
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (team_id, user_id, team_role)
    ON CONFLICT (team_id, user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        is_active = true;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove user from team
CREATE OR REPLACE FUNCTION remove_user_from_team(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is team admin
    IF NOT EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_id = remove_user_from_team.team_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only team admins can remove members';
    END IF;
    
    -- Remove user from team
    UPDATE team_members 
    SET is_active = false 
    WHERE team_id = remove_user_from_team.team_id 
    AND user_id = remove_user_from_team.user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create triggers for automatic updates

-- Trigger function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW(), last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for messages
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_status(is_online);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 9. Insert sample data for testing

-- Create a general company team
INSERT INTO teams (name, description, department, created_by)
VALUES ('General Company', 'Company-wide communications', 'All Departments', 
        (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add all existing users to the general team
INSERT INTO team_members (team_id, user_id, role)
SELECT 
    (SELECT id FROM teams WHERE name = 'General Company'),
    id,
    'member'
FROM auth.users
ON CONFLICT DO NOTHING;

-- Create a general company chat
INSERT INTO conversations (name, type, created_by, metadata)
VALUES ('General Company Chat', 'team', 
        (SELECT id FROM auth.users LIMIT 1),
        jsonb_build_object('team_id', (SELECT id FROM teams WHERE name = 'General Company')))
ON CONFLICT DO NOTHING;

-- Add all team members to the general chat
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT 
    (SELECT id FROM conversations WHERE name = 'General Company Chat'),
    user_id
FROM team_members
WHERE team_id = (SELECT id FROM teams WHERE name = 'General Company')
ON CONFLICT DO NOTHING;

-- 10. Add comments for documentation
COMMENT ON TABLE conversations IS 'Chat conversations - direct messages, group chats, and team chats';
COMMENT ON TABLE teams IS 'Organizational teams for group communication';
COMMENT ON TABLE team_members IS 'Users belonging to teams with specific roles';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Individual chat messages with support for replies and editing';
COMMENT ON TABLE user_status IS 'User online status and availability';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for conversations';
COMMENT ON TABLE message_reactions IS 'User reactions to chat messages';
COMMENT ON TABLE file_attachments IS 'File attachments for chat messages';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Chat System setup completed successfully!';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '- Direct messaging between users';
    RAISE NOTICE '- Team-based group chats';
    RAISE NOTICE '- Custom group conversations';
    RAISE NOTICE '- Message reactions and file attachments';
    RAISE NOTICE '- Real-time typing indicators';
    RAISE NOTICE '- User online status tracking';
    RAISE NOTICE '- Team management with roles';
END $$;

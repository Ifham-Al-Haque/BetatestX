-- Fix Chat System Complete Implementation
-- This script creates a fully functional chat system for UHub
-- Run this in your Supabase SQL editor

-- 1. Clean up existing chat tables to avoid conflicts
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_status CASCADE;

-- 2. Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_user_conversations() CASCADE;
DROP FUNCTION IF EXISTS get_available_users_for_chat() CASCADE;
DROP FUNCTION IF EXISTS create_direct_conversation(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_group_conversation(VARCHAR, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Create basic chat system tables
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255), -- For group chats, NULL for direct messages
    type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' or 'group'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}' -- For additional chat settings
);

CREATE TABLE conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false, -- For group chat admins
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    metadata JSONB DEFAULT '{}', -- For file info, reactions, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL -- For reply messages
);

CREATE TABLE user_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_message VARCHAR(255), -- Custom status like "In a meeting", "Available", etc.
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

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_status(is_online);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
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

CREATE POLICY "Conversation creators can update their conversations" ON conversations
    FOR UPDATE USING (auth.uid() = created_by);

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

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (auth.uid() = user_id);

-- 7. Create RPC functions for chat operations

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
        u.id as user_id,
        COALESCE(u.full_name, u.email) as full_name,
        u.avatar_url,
        u.role,
        u.department,
        COALESCE(us.is_online, false) as is_online,
        us.last_seen,
        us.status_message
    FROM users u
    LEFT JOIN user_status us ON u.id = us.user_id
    WHERE u.id != auth.uid()  -- Exclude current user
    AND u.id IS NOT NULL
    AND u.status = 'active'  -- Only active users
    ORDER BY 
        us.is_online DESC NULLS LAST,
        us.last_seen DESC NULLS LAST,
        COALESCE(u.full_name, u.email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's conversations with latest message
CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE (
    conversation_id UUID,
    conversation_name VARCHAR,
    conversation_type VARCHAR,
    last_message_content TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    participants_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        COALESCE(c.name, 
            CASE 
                WHEN c.type = 'direct' THEN (
                    SELECT COALESCE(u.full_name, u.email)
                    FROM conversation_participants cp2
                    JOIN users u ON cp2.user_id = u.id
                    WHERE cp2.conversation_id = c.id 
                    AND cp2.user_id != auth.uid()
                    LIMIT 1
                )
                ELSE 'Direct Message'
            END
        ) as conversation_name,
        c.type,
        m.content,
        m.created_at,
        COALESCE(
            (SELECT COUNT(*) 
             FROM messages m2 
             WHERE m2.conversation_id = c.id 
             AND m2.created_at > cp.last_read_at
             AND m2.sender_id != auth.uid()), 0
        ) as unread_count,
        (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) as participants_count
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) m ON true
    WHERE cp.user_id = auth.uid()
    AND c.is_active = true
    ORDER BY m.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a direct conversation between two users
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

-- Function to create a group conversation
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

-- 8. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 10. Insert sample data for testing
-- Create a general company chat
INSERT INTO conversations (name, type, created_by) 
VALUES ('UDrive General', 'group', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add all users to general chat
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT 
    (SELECT id FROM conversations WHERE name = 'UDrive General' LIMIT 1),
    id 
FROM users
WHERE status = 'active'
ON CONFLICT DO NOTHING;

-- 11. Add comments for documentation
COMMENT ON TABLE conversations IS 'Chat conversations - both direct messages and group chats';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Individual chat messages';
COMMENT ON TABLE user_status IS 'User online status and availability';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for conversations';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Chat System setup completed successfully!';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '- Direct messaging between users';
    RAISE NOTICE '- Group conversations';
    RAISE NOTICE '- Real-time typing indicators';
    RAISE NOTICE '- User online status tracking';
    RAISE NOTICE '- Message history and unread counts';
END $$;

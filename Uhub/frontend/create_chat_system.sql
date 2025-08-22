-- Create Chat System Database Schema for Uhub
-- This will enable real-time messaging between users

-- 1. Create conversations table for chat rooms and direct messages
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255), -- For group chats, NULL for direct messages
    type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' or 'group'
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}' -- For additional chat settings
);

-- 2. Create conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false, -- For group chat admins
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS messages (
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

-- 4. Create user online status table
CREATE TABLE IF NOT EXISTS user_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_message VARCHAR(255), -- Custom status like "In a meeting", "Available", etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_status(is_online);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for conversations
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

-- 9. Create RLS policies for conversation participants
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

-- 10. Create RLS policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Message senders can edit their messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- 11. Create RLS policies for user status
CREATE POLICY "Users can view all user statuses" ON user_status
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own status" ON user_status
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own status" ON user_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Create RLS policies for typing indicators
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = typing_indicators.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own typing indicators" ON typing_indicators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own typing indicators" ON typing_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 13. Create functions for chat operations

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
                    SELECT up.full_name 
                    FROM conversation_participants cp2
                    JOIN user_profiles up ON cp2.user_id = up.id
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

-- 14. Create triggers for updated_at timestamps
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

-- 15. Insert sample data for testing (optional)
-- This will create some initial conversations for testing

-- Create a general company chat
INSERT INTO conversations (name, type, created_by) 
VALUES ('UDrive General', 'group', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add all users to general chat (you'll need to run this after users exist)
-- INSERT INTO conversation_participants (conversation_id, user_id)
-- SELECT 
--     (SELECT id FROM conversations WHERE name = 'UDrive General' LIMIT 1),
--     id 
-- FROM auth.users;

COMMENT ON TABLE conversations IS 'Chat conversations - both direct messages and group chats';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Individual chat messages';
COMMENT ON TABLE user_status IS 'User online status and availability';
COMMENT ON TABLE typing_indicators IS 'Real-time typing indicators for conversations';

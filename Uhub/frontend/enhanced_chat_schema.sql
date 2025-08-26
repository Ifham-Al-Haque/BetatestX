-- Enhanced Chat System Database Schema Updates
-- This adds advanced features to the existing chat system

-- 1. Add message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- 'like', 'love', 'laugh', 'wow', 'sad', 'angry'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction_type)
);

-- 2. Add file attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add conversation categories table
CREATE TABLE IF NOT EXISTS conversation_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add conversation settings table
CREATE TABLE IF NOT EXISTS conversation_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, setting_key)
);

-- 5. Add pinned messages table
CREATE TABLE IF NOT EXISTS pinned_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, message_id)
);

-- 6. Add conversation invites table
CREATE TABLE IF NOT EXISTS conversation_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invite_message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Update conversations table with new fields
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES conversation_categories(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 100;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. Update messages table with new fields
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- 9. Update user_status table with new fields
ALTER TABLE user_status ADD COLUMN IF NOT EXISTS custom_status VARCHAR(100);
ALTER TABLE user_status ADD COLUMN IF NOT EXISTS status_emoji VARCHAR(10);
ALTER TABLE user_status ADD COLUMN IF NOT EXISTS do_not_disturb BOOLEAN DEFAULT false;
ALTER TABLE user_status ADD COLUMN IF NOT EXISTS away_until TIMESTAMP WITH TIME ZONE;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_message_id ON file_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation_id ON pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_invites_conversation_id ON conversation_invites(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_invites_invited_user_id ON conversation_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_conversations_category_id ON conversations(category_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON conversations(last_activity);

-- 11. Enable Row Level Security
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_invites ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for message reactions
CREATE POLICY "Users can view reactions in their conversations" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            JOIN messages m ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_reactions.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages in their conversations" ON message_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            JOIN messages m ON m.conversation_id = cp.conversation_id
            WHERE m.id = message_reactions.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove their own reactions" ON message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- 13. Create RLS policies for file attachments
CREATE POLICY "Users can view attachments in their conversations" ON file_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            JOIN messages m ON m.conversation_id = cp.conversation_id
            WHERE m.id = file_attachments.message_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add attachments to their messages" ON file_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            JOIN messages m ON m.conversation_id = cp.conversation_id
            WHERE m.id = file_attachments.message_id
            AND m.sender_id = auth.uid()
            AND cp.user_id = auth.uid()
        )
    );

-- 14. Create RLS policies for conversation categories
CREATE POLICY "Everyone can view conversation categories" ON conversation_categories
    FOR SELECT USING (true);

-- 15. Create RLS policies for conversation settings
CREATE POLICY "Users can view settings in their conversations" ON conversation_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_settings.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Conversation admins can modify settings" ON conversation_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_settings.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_admin = true
        )
    );

-- 16. Create RLS policies for pinned messages
CREATE POLICY "Users can view pinned messages in their conversations" ON pinned_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = pinned_messages.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Conversation admins can pin messages" ON pinned_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = pinned_messages.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_admin = true
        )
    );

-- 17. Create RLS policies for conversation invites
CREATE POLICY "Users can view invites for conversations they're in" ON conversation_invites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_invites.conversation_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own invites" ON conversation_invites
    FOR SELECT USING (auth.uid() = invited_user_id);

CREATE POLICY "Conversation admins can send invites" ON conversation_invites
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = conversation_invites.conversation_id
            AND cp.user_id = auth.uid()
            AND cp.is_admin = true
        )
    );

CREATE POLICY "Users can update their own invite responses" ON conversation_invites
    FOR UPDATE USING (auth.uid() = invited_user_id);

-- 18. Insert default conversation categories
INSERT INTO conversation_categories (name, description, color, icon) VALUES
('Work', 'Professional work-related conversations', '#10B981', 'briefcase'),
('Team', 'Team collaboration and coordination', '#3B82F6', 'users'),
('Project', 'Project-specific discussions', '#8B5CF6', 'folder'),
('Social', 'Casual social conversations', '#F59E0B', 'coffee'),
('Support', 'Help and support discussions', '#EF4444', 'life-buoy'),
('Announcements', 'Important announcements and updates', '#06B6D4', 'megaphone')
ON CONFLICT DO NOTHING;

-- 19. Create function to update conversation last activity
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_activity = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 20. Create trigger to update conversation activity
CREATE TRIGGER update_conversation_activity_trigger
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_activity();

-- 21. Create function to get conversation statistics
CREATE OR REPLACE FUNCTION get_conversation_stats(conv_id UUID)
RETURNS TABLE (
    total_messages BIGINT,
    total_participants BIGINT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    pinned_messages_count BIGINT,
    file_attachments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM messages WHERE conversation_id = conv_id) as total_messages,
        (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = conv_id) as total_participants,
        (SELECT MAX(created_at) FROM messages WHERE conversation_id = conv_id) as last_message_time,
        (SELECT COUNT(*) FROM pinned_messages WHERE conversation_id = conv_id) as pinned_messages_count,
        (SELECT COUNT(*) FROM file_attachments fa 
         JOIN messages m ON m.id = fa.message_id 
         WHERE m.conversation_id = conv_id) as file_attachments_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22. Create function to search messages across conversations
CREATE OR REPLACE FUNCTION search_messages(search_query TEXT, user_id UUID)
RETURNS TABLE (
    message_id UUID,
    conversation_id UUID,
    conversation_name TEXT,
    content TEXT,
    sender_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        COALESCE(c.name, 'Direct Message') as conversation_name,
        m.content,
        up.full_name as sender_name,
        m.created_at,
        ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', search_query)) as relevance_score
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    JOIN user_profiles up ON m.sender_id = up.user_id
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = search_messages.user_id
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', search_query)
    ORDER BY relevance_score DESC, m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 23. Add comments
COMMENT ON TABLE message_reactions IS 'User reactions to chat messages (like, love, etc.)';
COMMENT ON TABLE file_attachments IS 'File attachments for chat messages';
COMMENT ON TABLE conversation_categories IS 'Categories for organizing conversations';
COMMENT ON TABLE conversation_settings IS 'Custom settings for conversations';
COMMENT ON TABLE pinned_messages IS 'Messages pinned to the top of conversations';
COMMENT ON TABLE conversation_invites IS 'Invitations to join conversations';

-- 24. Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;
GRANT SELECT, INSERT ON file_attachments TO authenticated;
GRANT SELECT ON conversation_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_settings TO authenticated;
GRANT SELECT, INSERT ON pinned_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_invites TO authenticated;

-- 25. Create view for enhanced conversation list
CREATE OR REPLACE VIEW enhanced_conversation_list AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.category_id,
    c.is_public,
    c.description,
    c.avatar_url,
    c.last_activity,
    cc.name as category_name,
    cc.color as category_color,
    cc.icon as category_icon,
    (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) as participants_count,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as total_messages,
    (SELECT COUNT(*) FROM pinned_messages WHERE conversation_id = c.id) as pinned_messages_count,
    (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
    (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
    (SELECT COUNT(*) FROM messages m 
     JOIN conversation_participants cp ON c.id = cp.conversation_id 
     WHERE m.conversation_id = c.id 
     AND m.created_at > cp.last_read_at 
     AND m.sender_id != cp.user_id) as unread_count
FROM conversations c
LEFT JOIN conversation_categories cc ON c.category_id = cc.id
WHERE c.is_active = true;

-- Grant access to the view
GRANT SELECT ON enhanced_conversation_list TO authenticated;

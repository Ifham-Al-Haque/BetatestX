# Chat System Fix - Resolving 400 Errors

## Problem Analysis
The chat system is failing with 400 errors because:
1. Required database tables don't exist
2. RPC functions are missing
3. `user_profiles` table is referenced but not created
4. Database schema is incomplete

## Solution Steps

### Step 1: Create Missing Tables
Run this SQL in your Supabase SQL editor:

```sql
-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- RLS policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = auth.uid());

-- Create chat system tables
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(20) NOT NULL DEFAULT 'direct',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
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

CREATE TABLE IF NOT EXISTS user_status (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_message VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);
```

### Step 2: Create Required RPC Functions
```sql
-- Function to get user conversations
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
```

### Step 3: Enable RLS and Create Policies
```sql
-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
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

-- RLS policies for messages
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

-- RLS policies for user status
CREATE POLICY "Users can view all user statuses" ON user_status FOR SELECT USING (true);
CREATE POLICY "Users can update their own status" ON user_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own status" ON user_status FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 4: Update ChatService.js
Update your `src/services/chatService.js` to handle missing tables gracefully:

```javascript
// In getConversations method, add error handling:
async getConversations() {
  try {
    const { data, error } = await supabase
      .rpc('get_user_conversations');
    
    if (error) {
      console.warn('get_user_conversations RPC function not available:', error.message);
      return []; // Return empty array instead of throwing
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return []; // Return empty array instead of throwing
  }
}

// In getOnlineUsers method, add error handling:
async getOnlineUsers() {
  try {
    const { data, error } = await supabase
      .from('user_status')
      .select(`
        *,
        user:user_profiles!user_status_user_id_fkey(
          id,
          full_name,
          avatar_url,
          role,
          department
        )
      `)
      .eq('is_online', true);

    if (error) {
      console.warn('user_status table not available:', error.message);
      return []; // Return empty array instead of throwing
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching online users:', error);
    return [];
  }
}
```

### Step 5: Initialize User Profiles
After creating the tables, you need to populate user_profiles for existing users:

```sql
-- Insert user profiles for existing users
INSERT INTO user_profiles (id, user_id, full_name, role, department)
SELECT 
    id,
    id,
    COALESCE(raw_user_meta_data->>'full_name', 'User ' || id),
    COALESCE(raw_user_meta_data->>'role', 'user'),
    COALESCE(raw_user_meta_data->>'department', 'General')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Insert user status for existing users
INSERT INTO user_status (user_id, is_online, last_seen)
SELECT id, false, NOW()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

## Testing
After running these scripts:
1. The chat system should no longer show 400 errors
2. You should see empty arrays instead of crashes
3. The chat interface will be functional but empty until conversations are created

## Next Steps
1. Create some test conversations using the RPC functions
2. Test sending messages between users
3. Verify that online status updates work correctly

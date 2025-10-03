import { supabase } from '../supabaseClient';

class ChatServiceImproved {
  constructor() {
    this.subscriptions = new Map();
  }

  // Helper method to get current user with better error handling
  async getCurrentUser() {
    try {
      // First try to get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }
      
      if (!session || !session.user) {
        console.warn('No active session found');
        return null;
      }
      
      return session.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Get all conversations for the current user with better error handling
  async getConversations() {
    try {
      // Temporarily disable conversations fetch to prevent database errors
      console.log('🔄 Conversations fetch disabled to prevent database errors');
      return [];
      
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found, returning empty array');
        return [];
      }

      console.log('🔍 Fetching conversations for user:', currentUser.id);

      // Try to get conversations with better error handling
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          type,
          created_by,
          is_active,
          last_message_at,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false }); // Use created_at as fallback

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        
        // Handle specific error cases
        if (conversationsError.code === 'PGRST116' || 
            conversationsError.status === 404 || 
            conversationsError.code === '42P01' || 
            conversationsError.message?.includes('does not exist') ||
            conversationsError.message?.includes('relation') ||
            conversationsError.code === 'PGRST200') {
          console.warn('Conversations table not found, returning empty array');
          return [];
        }
        
        if (conversationsError.code === 'PGRST301' || conversationsError.status === 403) {
          console.warn('Access denied to conversations table, returning empty array');
          return [];
        }
        
        // Handle infinite recursion policy error
        if (conversationsError.code === '42P17' || 
            conversationsError.message?.includes('infinite recursion')) {
          console.warn('Infinite recursion detected in conversations policy, returning empty array');
          return [];
        }
        
        return [];
      }

      if (!conversationsData || conversationsData.length === 0) {
        console.log('No conversations found');
        return [];
      }

      console.log(`Found ${conversationsData.length} conversations`);

      // Get participants for each conversation
      const conversationIds = conversationsData.map(conv => conv.id);
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, joined_at, last_read_at')
        .in('conversation_id', conversationIds);

      if (participantsError) {
        console.warn('Error fetching participants:', participantsError);
      }

      // Filter conversations where current user is a participant
      const userConversationIds = (participantsData || [])
        .filter(p => p.user_id === currentUser.id)
        .map(p => p.conversation_id);

      const userConversations = conversationsData.filter(conv => 
        userConversationIds.includes(conv.id)
      );

      console.log(`User participates in ${userConversations.length} conversations`);

      // Add participants to each conversation
      const result = userConversations.map(conv => ({
        ...conv,
        participants: (participantsData || []).filter(p => p.conversation_id === conv.id)
      }));

      return result;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, limit = 50) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found');
        return [];
      }

      console.log('🔍 Fetching messages for conversation:', conversationId);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          is_edited,
          edited_at,
          created_at,
          updated_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return [];
      }

      return (messagesData || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(conversationId, content) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('📤 Sending message to conversation:', conversationId);

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: content.trim(),
          message_type: 'text'
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        throw messageError;
      }

      console.log('✅ Message sent successfully');
      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Create a direct conversation
  async createDirectConversation(userId) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (currentUser.id === userId) {
        throw new Error('Cannot create conversation with yourself');
      }

      console.log('💬 Creating direct conversation with user:', userId);

      // Check if conversation already exists
      const { data: existingConversations, error: checkError } = await supabase
        .from('conversations')
        .select(`
          id,
          conversation_participants!inner(user_id)
        `)
        .eq('type', 'direct')
        .eq('is_active', true);

      if (checkError) {
        console.warn('Error checking existing conversations:', checkError);
      }

      // Check if direct conversation already exists between these users
      if (existingConversations) {
        for (const conv of existingConversations) {
          const participantIds = conv.conversation_participants.map(p => p.user_id);
          if (participantIds.includes(currentUser.id) && participantIds.includes(userId)) {
            console.log('Direct conversation already exists:', conv.id);
            return conv.id;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: currentUser.id,
          is_active: true
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw convError;
      }

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: currentUser.id },
          { conversation_id: conversation.id, user_id: userId }
        ]);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        throw participantsError;
      }

      console.log('✅ Direct conversation created:', conversation.id);
      return conversation.id;
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      throw error;
    }
  }

  // Get all users for creating conversations
  async getAllUsers() {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found');
        return [];
      }

      console.log('👥 Fetching all users');

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          auth_user_id,
          full_name,
          email,
          avatar_url,
          department,
          role,
          status
        `)
        .neq('auth_user_id', currentUser.id) // Exclude current user
        .eq('status', 'active') // Only active users
        .order('full_name', { ascending: true });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      return usersData || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Update user status
  async updateUserStatus(status) {
    try {
      // Temporarily disable user status updates to prevent database errors
      console.log('🔄 User status update disabled to prevent database errors');
      return;
      
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user found');
        return;
      }

      console.log('🔄 Updating user status to:', status);

      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: currentUser.id,
          is_online: status === 'online' || status === true,
          last_seen: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating user status:', error);
        
        // Handle specific error cases
        if (error.code === 'PGRST116' || 
            error.status === 404 || 
            error.code === '42P01' || 
            error.code === '42703' ||
            error.code === 'PGRST204' ||
            error.message?.includes('does not exist') ||
            error.message?.includes('relation') ||
            error.code === 'PGRST200') {
          console.warn('User status table not found or column does not exist, skipping status update');
          return;
        }
        
        if (error.code === 'PGRST301' || error.status === 403) {
          console.warn('Access denied to user status table, skipping status update');
          return;
        }
      } else {
        console.log('✅ User status updated');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      // Temporarily disable online users fetch to prevent database errors
      console.log('🔄 Online users fetch disabled to prevent database errors');
      return [];
      
      // First try to get user status data
      const { data: userStatusData, error: statusError } = await supabase
        .from('user_status')
        .select('user_id, is_online, last_seen')
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (statusError) {
        console.error('Error fetching user status:', statusError);
        
        // Handle specific error cases
        if (statusError.code === 'PGRST116' || 
            statusError.status === 404 || 
            statusError.code === '42P01' || 
            statusError.code === '42703' ||
            statusError.message?.includes('does not exist') ||
            statusError.message?.includes('relation') ||
            statusError.code === 'PGRST200') {
          console.warn('User status table not found or column does not exist, returning empty array');
          return [];
        }
        
        if (statusError.code === 'PGRST301' || statusError.status === 403) {
          console.warn('Access denied to user status table, returning empty array');
          return [];
        }
        
        return [];
      }

      if (!userStatusData || userStatusData.length === 0) {
        return [];
      }

      // Get user details for each online user
      const userIds = userStatusData.map(status => status.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, auth_user_id, full_name, email, avatar_url, department')
        .in('auth_user_id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return [];
      }

      // Combine the data
      const onlineUsers = userStatusData.map(status => {
        const user = usersData?.find(u => u.auth_user_id === status.user_id);
        return {
          user_id: status.user_id,
          status: status.is_online ? 'online' : 'offline',
          last_seen: status.last_seen,
          users: user || null
        };
      }).filter(item => item.users !== null);

      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return;
      }

      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Subscribe to new conversations
  async subscribeToNewConversations(callback) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.warn('User not authenticated, skipping conversation subscription');
        return null;
      }

      const channel = supabase
        .channel('new-conversations')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'conversations'
          }, 
          (payload) => {
            console.log('💬 New conversation created:', payload);
            callback();
          }
        )
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'conversation_participants',
            filter: `user_id=eq.${currentUser.id}`
          }, 
          (payload) => {
            console.log('👥 User added to conversation:', payload);
            callback();
          }
        )
        .subscribe();

      this.subscriptions.set('new-conversations', channel);
      return channel;
    } catch (error) {
      console.error('Error setting up new conversations subscription:', error);
      return null;
    }
  }

  // Subscribe to user status changes
  async subscribeToUserStatus(callback) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.warn('User not authenticated, skipping user status subscription');
        return null;
      }

      const channel = supabase
        .channel('user-status-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_status'
          }, 
          (payload) => {
            console.log('👤 User status changed:', payload);
            callback(payload);
          }
        )
        .subscribe();

      this.subscriptions.set('user-status-changes', channel);
      return channel;
    } catch (error) {
      console.error('Error setting up user status subscription:', error);
      return null;
    }
  }

  // Setup real-time subscriptions
  setupConversationSubscription(conversationId, onMessage) {
    try {
      const channel = supabase
        .channel(`conversation-${conversationId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          }, 
          (payload) => {
            console.log('📨 New message received:', payload);
            onMessage(payload.new);
          }
        )
        .subscribe();

      this.subscriptions.set(`conversation-${conversationId}`, channel);
      return channel;
    } catch (error) {
      console.error('Error setting up conversation subscription:', error);
      return null;
    }
  }

  // Cleanup subscriptions
  cleanupSubscriptions() {
    this.subscriptions.forEach((channel, key) => {
      console.log('🧹 Cleaning up subscription:', key);
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
const chatService = new ChatServiceImproved();
export default chatService;

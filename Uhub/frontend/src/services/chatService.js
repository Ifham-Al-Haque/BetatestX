import { supabase } from '../supabaseClient';

class ChatService {
  // Get all conversations for the current user
  async getConversations() {
    try {
      // First check if the RPC function exists, if not, return empty array
      const { data, error } = await supabase
        .rpc('get_user_conversations');
      
      if (error) {
        // If RPC function doesn't exist, return empty array instead of throwing
        console.warn('get_user_conversations RPC function not available:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }

  // Get messages for a specific conversation
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(
            id,
            full_name,
            avatar_url,
            role,
            department
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn('Error fetching messages:', error.message);
        return [];
      }
      return (data || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(conversationId, content, messageType = 'text', metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          message_type: messageType,
          metadata
        })
        .select()
        .single();

      if (error) {
        console.warn('Error sending message:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Create a direct conversation with another user
  async createDirectConversation(otherUserId) {
    try {
      const { data, error } = await supabase
        .rpc('create_direct_conversation', { other_user_id: otherUserId });

      if (error) {
        console.warn('create_direct_conversation RPC function not available:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      return null;
    }
  }

  // Create a group conversation
  async createGroupConversation(groupName, participantIds) {
    try {
      const { data, error } = await supabase
        .rpc('create_group_conversation', { 
          group_name: groupName, 
          participant_ids: participantIds 
        });

      if (error) {
        console.warn('create_group_conversation RPC function not available:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating group conversation:', error);
      return null;
    }
  }

  // Get conversation participants
  async getConversationParticipants(conversationId) {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          *,
          user:user_profiles!conversation_participants_user_id_fkey(
            id,
            full_name,
            avatar_url,
            role,
            department
          )
        `)
        .eq('conversation_id', conversationId);

      if (error) {
        console.warn('Error fetching conversation participants:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation participants:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId) {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', (await supabase.auth.getUser()).data.user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Update user online status
  async updateUserStatus(isOnline, statusMessage = null) {
    try {
      const userId = (await supabase.auth.getUser()).data.user.id;
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          status_message: statusMessage,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      // First check if user_status table exists
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
        // If table doesn't exist, return empty array instead of throwing
        console.warn('user_status table not available:', error.message);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching online users:', error);
      return [];
    }
  }

  // Set typing indicator
  async setTypingIndicator(conversationId, isTyping) {
    try {
      const userId = (await supabase.auth.getUser()).data.user.id;
      
      if (isTyping) {
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: userId,
            is_typing: true
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  // Get typing indicators for a conversation
  async getTypingIndicators(conversationId) {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select(`
          *,
          user:user_profiles!typing_indicators_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_typing', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
      throw error;
    }
  }

  // Search users for starting conversations
  async searchUsers(query, excludeCurrentUser = true) {
    try {
      let queryBuilder = supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, role, department')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (excludeCurrentUser) {
        const currentUser = (await supabase.auth.getUser()).data.user;
        queryBuilder = queryBuilder.neq('id', currentUser.id);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Subscribe to real-time updates for a conversation
  subscribeToConversation(conversationId, callback) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversation_participants',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();
  }

  // Subscribe to typing indicators
  subscribeToTypingIndicators(conversationId, callback) {
    return supabase
      .channel(`typing:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();
  }

  // Subscribe to user status changes
  subscribeToUserStatus(callback) {
    return supabase
      .channel('user_status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status'
      }, callback)
      .subscribe();
  }

  // Subscribe to new conversations
  async subscribeToNewConversations(callback) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      return supabase
        .channel('new_conversations')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${user.id}`
        }, callback)
        .subscribe();
    } catch (error) {
      console.error('Error setting up new conversations subscription:', error);
      return null;
    }
  }

  // Cleanup subscriptions
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
}

export const chatService = new ChatService();
export default chatService;

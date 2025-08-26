import { supabase } from '../supabaseClient';

class EnhancedChatService {
  constructor() {
    this.subscriptions = [];
  }

  // Enhanced conversation creation
  async createDirectChat(otherUserId) {
    try {
      const { data, error } = await supabase
        .rpc('create_direct_conversation', { other_user_id: otherUserId });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating direct chat:', error);
      throw error;
    }
  }

  // Create group chat with multiple participants
  async createGroupChat(groupName, participantIds, groupType = 'group') {
    try {
      const { data, error } = await supabase
        .rpc('create_group_conversation', { 
          group_name: groupName, 
          participant_ids: participantIds 
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  // Create team conversation
  async createTeamChat(teamId) {
    try {
      const { data, error } = await supabase
        .rpc('create_team_conversation', { team_id: teamId });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating team chat:', error);
      throw error;
    }
  }

  // Get enhanced conversations with more details
  async getEnhancedConversations() {
    try {
      const { data, error } = await supabase
        .rpc('get_user_conversations_enhanced');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get all available users for chat
  async getAvailableUsers() {
    try {
      const { data, error } = await supabase
        .rpc('get_available_users_for_chat');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available users:', error);
      return [];
    }
  }

  // Get all teams
  async getTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  // Get team members
  async getTeamMembers(teamId) {
    try {
      const { data, error } = await supabase
        .rpc('get_team_members', { team_id: teamId });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  // Add user to team
  async addUserToTeam(teamId, userId, role = 'member') {
    try {
      const { data, error } = await supabase
        .rpc('add_user_to_team', { 
          team_id: teamId, 
          user_id: userId, 
          team_role: role 
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding user to team:', error);
      throw error;
    }
  }

  // Remove user from team
  async removeUserFromTeam(teamId, userId) {
    try {
      const { data, error } = await supabase
        .rpc('remove_user_from_team', { 
          team_id: teamId, 
          user_id: userId 
        });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error removing user from team:', error);
      throw error;
    }
  }

  // Get conversation details with participants
  async getConversationDetails(conversationId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            *,
            user:user_profiles(
              id,
              full_name,
              avatar_url,
              role,
              department
            )
          )
        `)
        .eq('id', conversationId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      return null;
    }
  }

  // Send message with enhanced features
  async sendEnhancedMessage(conversationId, content, messageType = 'text', metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          message_type: messageType,
          metadata
        })
        .select(`
          *,
          sender:user_profiles(
            id,
            full_name,
            avatar_url,
            role,
            department
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getEnhancedMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles(
            id,
            full_name,
            avatar_url,
            role,
            department
          ),
          reply_to:messages(
            id,
            content,
            sender:user_profiles(
              id,
              full_name
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Search users with filters
  async searchUsers(query, filters = {}) {
    try {
      let queryBuilder = supabase
        .from('user_profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,department.ilike.%${query}%,role.ilike.%${query}%`)
        .limit(20);

      if (filters.department) {
        queryBuilder = queryBuilder.eq('department', filters.department);
      }

      if (filters.role) {
        queryBuilder = queryBuilder.eq('role', filters.role);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get online users with status
  async getOnlineUsersWithStatus() {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select(`
          *,
          user:user_profiles(
            id,
            full_name,
            avatar_url,
            role,
            department
          )
        `)
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching online users:', error);
      return [];
    }
  }

  // Update user status with custom message
  async updateUserStatus(isOnline, statusMessage = null, customStatus = null) {
    try {
      const userId = (await supabase.auth.getUser()).data.user.id;
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          status_message: statusMessage,
          custom_status: customStatus,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get departments for filtering
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('department')
        .not('department', 'is', null);

      if (error) throw error;
      
      // Get unique departments
      const departments = [...new Set(data.map(item => item.department))];
      return departments.sort();
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  // Get roles for filtering
  async getRoles() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .not('role', 'is', null);

      if (error) throw error;
      
      // Get unique roles
      const roles = [...new Set(data.map(item => item.role))];
      return roles.sort();
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId) {
    try {
      const userId = (await supabase.auth.getUser()).data.user.id;
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, reactionType) {
    try {
      const userId = (await supabase.auth.getUser()).data.user.id;
      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          reaction_type: reactionType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from message
  async removeReaction(messageId, reactionType) {
    try {
      const userId = (await supabase.auth.getUser()).data.user.id;
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Setup real-time subscriptions
  setupRealTimeSubscriptions(callbacks) {
    const subs = [];

    // Messages subscription
    const messagesSub = supabase
      .channel('enhanced_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, callbacks.onNewMessage)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, callbacks.onMessageUpdate)
      .subscribe();
    subs.push(messagesSub);

    // Reactions subscription
    const reactionsSub = supabase
      .channel('message_reactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, callbacks.onReactionChange)
      .subscribe();
    subs.push(reactionsSub);

    // User status subscription
    const statusSub = supabase
      .channel('user_status_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status'
      }, callbacks.onStatusChange)
      .subscribe();
    subs.push(statusSub);

    // Typing indicators subscription
    const typingSub = supabase
      .channel('typing_indicators')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators'
      }, callbacks.onTypingChange)
      .subscribe();
    subs.push(typingSub);

    this.subscriptions = subs;
    return subs;
  }

  // Cleanup subscriptions
  cleanup() {
    this.subscriptions.forEach(sub => {
      supabase.removeChannel(sub);
    });
    this.subscriptions = [];
  }
}

export const enhancedChatService = new EnhancedChatService();
export default enhancedChatService;

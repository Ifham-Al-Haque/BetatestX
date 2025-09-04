import { supabase } from '../supabaseClient';

class ChatService {
  constructor() {
    this.subscriptions = new Map();
  }

  // Get all conversations for the current user
  async getConversations() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user:user_id(
              id,
              full_name,
              email,
              avatar_url,
              department,
              role
            )
          ),
          last_message:messages(
            content,
            created_at,
            sender:user_id(full_name)
          )
        `)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include participant count and unread count
      const transformedData = data.map(conv => ({
        ...conv,
        participants_count: conv.participants?.length || 0,
        conversation_name: conv.name || this.getConversationName(conv),
        conversation_type: conv.type,
        unread_count: 0, // This would be calculated based on read receipts
        last_message: conv.last_message?.[0] || null
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get conversation name based on participants
  getConversationName(conversation) {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.user.id !== supabase.auth.user()?.id);
      return otherParticipant?.user?.full_name || 'Unknown User';
    }
    
    return `Group Chat (${conversation.participants?.length || 0} members)`;
  }

  // Get all users for starting new conversations
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, department, role, last_seen')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_id(
            id,
            full_name,
            email,
            avatar_url
          ),
          attachments:file_attachments(*)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return (data || []).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId, content, attachments = []) {
    try {
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content.trim(),
          sender_id: supabase.auth.user()?.id
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Handle attachments if any
      if (attachments.length > 0) {
        const attachmentPromises = attachments.map(attachment => 
          this.uploadAttachment(messageData.id, attachment)
        );
        await Promise.all(attachmentPromises);
      }

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload file attachment
  async uploadAttachment(messageId, file) {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat-attachments/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Save attachment record
      const { data, error } = await supabase
        .from('file_attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: urlData.publicUrl,
          uploaded_by: supabase.auth.user()?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  // Create a direct conversation
  async createDirectConversation(userId) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select(`
          id,
          participants:conversation_participants(user_id)
        `)
        .eq('type', 'direct')
        .eq('is_active', true);

      const existingDirectConv = existingConv?.find(conv => 
        conv.participants?.length === 2 &&
        conv.participants.some(p => p.user_id === currentUserId) &&
        conv.participants.some(p => p.user_id === userId)
      );

      if (existingDirectConv) {
        return existingDirectConv.id;
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: currentUserId,
          is_active: true
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: currentUserId },
          { conversation_id: conversation.id, user_id: userId }
        ]);

      if (participantsError) throw participantsError;

      return conversation.id;
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      throw error;
    }
  }

  // Create a group conversation
  async createGroupConversation(name, userIds) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      const allUserIds = [currentUserId, ...userIds];

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name,
          type: 'group',
          created_by: currentUserId,
          is_active: true
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = allUserIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      return conversation.id;
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      // Update read receipts for unread messages
      const { error } = await supabase
        .from('read_receipts')
        .upsert({
          conversation_id: conversationId,
          user_id: currentUserId,
          last_read_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Set typing indicator
  async setTypingIndicator(conversationId, isTyping) {
    try {
      const currentUserId = supabase.auth.user()?.id;

      if (isTyping) {
        // Set typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: currentUserId,
            is_typing: true,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Remove typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  // Get typing indicators for a conversation
  async getTypingIndicators(conversationId) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      const { data, error } = await supabase
        .from('typing_indicators')
        .select(`
          *,
          user:user_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_typing', true)
        .neq('user_id', currentUserId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching typing indicators:', error);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(isOnline) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: currentUserId,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select(`
          *,
          user:user_id(
            id,
            full_name,
            email,
            avatar_url,
            department,
            role
          )
        `)
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }

  // Subscribe to conversation messages
  subscribeToConversation(conversationId, callback) {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();

    this.subscriptions.set(`conversation-${conversationId}`, channel);
    return channel;
  }

  // Subscribe to typing indicators
  subscribeToTypingIndicators(conversationId, callback) {
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();

    this.subscriptions.set(`typing-${conversationId}`, channel);
    return channel;
  }

  // Subscribe to user status changes
  subscribeToUserStatus(callback) {
    const channel = supabase
      .channel('user-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status'
      }, callback)
      .subscribe();

    this.subscriptions.set('user-status', channel);
    return channel;
  }

  // Subscribe to new conversations
  async subscribeToNewConversations(callback) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      const channel = supabase
        .channel('new-conversations')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_participants',
          filter: `user_id=eq.${currentUserId}`
        }, callback)
        .subscribe();

      this.subscriptions.set('new-conversations', channel);
      return channel;
    } catch (error) {
      console.error('Error subscribing to new conversations:', error);
      return null;
    }
  }

  // Subscribe to new messages for notifications
  subscribeToNewMessages(callback) {
    const channel = supabase
      .channel('new-messages-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, callback)
      .subscribe();

    this.subscriptions.set('new-messages-notifications', channel);
    return channel;
  }

  // Unsubscribe from a channel
  unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('sender_id', supabase.auth.user()?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Edit a message
  async editMessage(messageId, newContent) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
          is_edited: true
        })
        .eq('id', messageId)
        .eq('sender_id', supabase.auth.user()?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, emoji) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      const { data, error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: currentUserId,
          emoji
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
  async removeReaction(messageId, emoji) {
    try {
      const currentUserId = supabase.auth.user()?.id;
      
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Get message reactions
  async getMessageReactions(messageId) {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          *,
          user:user_id(full_name, avatar_url)
        `)
        .eq('message_id', messageId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message reactions:', error);
      throw error;
    }
  }
}

const chatService = new ChatService();
export default chatService;
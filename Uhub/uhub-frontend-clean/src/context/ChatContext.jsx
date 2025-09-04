import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Real-time subscriptions
  const [subscriptions, setSubscriptions] = useState([]);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
      
      // Calculate total unread count
      const totalUnread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load online users
  const loadOnlineUsers = useCallback(async () => {
    if (!user) return;
    
    try {
      const data = await chatService.getOnlineUsers();
      setOnlineUsers(data);
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  }, [user]);

  // Setup real-time subscriptions
  const setupSubscriptions = useCallback(async () => {
    if (!user) return;

    const subs = [];

    try {
      // Subscribe to new conversations
      const conversationSub = await chatService.subscribeToNewConversations(() => {
        loadConversations();
      });
      if (conversationSub) subs.push(conversationSub);

      // Subscribe to user status changes
      const statusSub = chatService.subscribeToUserStatus(() => {
        loadOnlineUsers();
      });
      subs.push(statusSub);

      setSubscriptions(subs);
    } catch (error) {
      console.error('Error setting up subscriptions:', error);
    }
  }, [user, loadConversations, loadOnlineUsers]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptions.forEach(sub => {
      chatService.unsubscribe(sub);
    });
    setSubscriptions([]);
  }, []);

  // Update user online status
  const updateUserStatus = useCallback(async (isOnline, statusMessage = null) => {
    if (!user) return;
    
    try {
      const result = await chatService.updateUserStatus(isOnline, statusMessage);
      if (!result) {
        console.warn('User status update skipped (table not available or user not authenticated)');
      }
    } catch (error) {
      console.warn('Failed to update user status:', error.message);
    }
  }, [user]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!user) return;
    
    try {
      await chatService.markMessagesAsRead(conversationId);
      
      // Update local state and unread count in one operation
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        );
        
        // Calculate new total unread count
        const newTotalUnread = updatedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setUnreadCount(newTotalUnread);
        
        return updatedConversations;
      });
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, [user]);

  // Add new message to conversation
  const addMessageToConversation = useCallback((conversationId, message) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          last_message_content: message.content,
          last_message_time: message.created_at,
          unread_count: conv.unread_count + (message.sender_id !== userId ? 1 : 0)
        };
      }
      return conv;
    }));
    
    // Update total unread count if message is from another user
    if (message.sender_id !== userId) {
      setUnreadCount(prev => prev + 1);
    }
  }, [userId]);

  // Update typing indicator
  const updateTypingIndicator = useCallback((conversationId, userId, isTyping) => {
    setIsTyping(prev => ({
      ...prev,
      [conversationId]: isTyping 
        ? [...(prev[conversationId] || []).filter(id => id !== userId), userId]
        : (prev[conversationId] || []).filter(id => id !== userId)
    }));
  }, []);

  // Initialize chat system
  useEffect(() => {
    if (user) {
      loadConversations();
      loadOnlineUsers();
      setupSubscriptions();
      updateUserStatus(true);
      
      // Set up page visibility change listener for online/offline status
      const handleVisibilityChange = () => {
        updateUserStatus(!document.hidden);
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        cleanupSubscriptions();
        updateUserStatus(false);
      };
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object or callback functions

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  const value = {
    // State
    conversations,
    unreadCount,
    onlineUsers,
    isTyping,
    loading,
    
    // Actions
    loadConversations,
    loadOnlineUsers,
    markConversationAsRead,
    addMessageToConversation,
    updateTypingIndicator,
    updateUserStatus
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

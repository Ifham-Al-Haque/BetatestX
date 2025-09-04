import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { supabase } from '../supabaseClient';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { addMessageToConversation } = useChat();
  
  // State for different notification types
  const [notifications, setNotifications] = useState([]);
  const [chatPopups, setChatPopups] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  
  // Refs for cleanup
  const subscriptionsRef = useRef([]);
  const chatSubscriptionsRef = useRef([]);

  // Add a new notification (for complaints, suggestions, calendar events, payments)
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 10000);
  }, []);

  // Add a chat popup (appears in center of screen)
  const addChatPopup = useCallback((popup) => {
    const id = Date.now() + Math.random();
    const newPopup = {
      id,
      ...popup,
      timestamp: new Date()
    };
    
    setChatPopups(prev => [...prev, newPopup]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeChatPopup(id);
    }, 5000);
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Remove chat popup
  const removeChatPopup = useCallback((id) => {
    setChatPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Setup real-time subscriptions for different notification types
  const setupSubscriptions = useCallback(async () => {
    if (!user) return;

    const subs = [];

    try {
      // Subscribe to new complaints
      const complaintsSub = supabase
        .channel('complaints_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints'
        }, (payload) => {
          if (payload.new.complainant_id !== user.id) {
            addNotification({
              type: 'complaint',
              title: 'New Complaint Filed',
              message: `A new complaint "${payload.new.title}" has been filed`,
              priority: payload.new.priority,
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(complaintsSub);

      // Subscribe to complaint status updates
      const complaintUpdatesSub = supabase
        .channel('complaint_updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints'
        }, (payload) => {
          if (payload.new.complainant_id === user.id) {
            addNotification({
              type: 'complaint_update',
              title: 'Complaint Status Updated',
              message: `Your complaint "${payload.new.title}" status changed to ${payload.new.status}`,
              priority: 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(complaintUpdatesSub);

      // Subscribe to new suggestions
      const suggestionsSub = supabase
        .channel('suggestions_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'suggestions'
        }, (payload) => {
          if (payload.new.suggester_id !== user.id) {
            addNotification({
              type: 'suggestion',
              title: 'New Suggestion Submitted',
              message: `A new suggestion "${payload.new.title}" has been submitted`,
              priority: 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(suggestionsSub);

      // Subscribe to new IT requests
      const itRequestsSub = supabase
        .channel('it_requests_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'it_requests'
        }, (payload) => {
          if (payload.new.requester_id !== user.id) {
            addNotification({
              type: 'it_request',
              title: 'New IT Request',
              message: `A new IT request "${payload.new.title}" has been submitted`,
              priority: payload.new.priority || 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(itRequestsSub);

      // Subscribe to IT request updates
      const itRequestUpdatesSub = supabase
        .channel('it_request_updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'it_requests'
        }, (payload) => {
          if (payload.new.requester_id === user.id) {
            addNotification({
              type: 'it_request_update',
              title: 'IT Request Updated',
              message: `Your IT request "${payload.new.title}" status changed to ${payload.new.status}`,
              priority: 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(itRequestUpdatesSub);

      // Subscribe to new messages for chat popups
      const messagesSub = supabase
        .channel('chat_messages_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          // Only show popup if message is not from current user
          if (payload.new.sender_id !== user.id) {
            // Check if user is participant in this conversation
            checkConversationParticipation(payload.new.conversation_id, payload.new);
          }
        })
        .subscribe();
      subs.push(messagesSub);

      // Setup additional notification types using the notification service
      await notificationService.setupAllNotifications(addNotification);

      subscriptionsRef.current = subs;
      setSubscriptions(subs);

    } catch (error) {
      console.error('Error setting up notification subscriptions:', error);
    }
  }, [user, addNotification]);

  // Check if user is participant in conversation before showing popup
  const checkConversationParticipation = useCallback(async (conversationId, message) => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (!error && data && data.length > 0) {
        // User is participant, show chat popup
        addChatPopup({
          type: 'chat_message',
          title: 'New Message',
          message: message.content,
          conversationId: conversationId,
          senderId: message.sender_id,
          data: message
        });
      }
    } catch (error) {
      console.error('Error checking conversation participation:', error);
    }
  }, [user, addChatPopup]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(sub => {
      supabase.removeChannel(sub);
    });
    subscriptionsRef.current = [];
    setSubscriptions([]);
    
    // Cleanup notification service subscriptions
    notificationService.cleanup();
  }, []);

  // Initialize notification system
  useEffect(() => {
    if (user) {
      setupSubscriptions();
      
      return () => {
        cleanupSubscriptions();
      };
    }
  }, [user, setupSubscriptions, cleanupSubscriptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  const value = {
    // State
    notifications,
    chatPopups,
    unreadCount,
    
    // Actions
    addNotification,
    addChatPopup,
    removeNotification,
    removeChatPopup,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

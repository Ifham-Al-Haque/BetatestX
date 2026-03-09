import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { supabase } from '../supabaseClient';
import notificationService from '../services/notificationService';
import soundNotificationService from '../services/soundNotificationService';

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

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Add a new notification (for complaints, suggestions, calendar events, payments)
  const addNotification = useCallback((notification, options = {}) => {
    const { autoDismiss = true, preserveId = false, playSound = autoDismiss } = options;
    const baseId = preserveId && notification?.id ? notification.id : Date.now() + Math.random();
    const timestamp = notification?.timestamp ? new Date(notification.timestamp) : new Date();
    const newNotification = {
      id: baseId,
      ...notification,
      timestamp,
      read: notification?.read ?? false
    };

    if (playSound) {
      const priority = notification?.priority || 'medium';
      const soundType = (() => {
        const type = notification?.type;
        switch (type) {
          case 'task_assignment':
          case 'task_assigned':
          case 'assignment':
            return 'task_assigned';
          case 'task_status_update':
            return 'status_change';
          case 'task_comment':
            return 'comment';
          case 'it_request_assigned':
            return 'it_request_assigned';
          case 'it_request':
          case 'it_request_update':
            return type;
          default:
            return type || priority || 'default';
        }
      })();

      soundNotificationService.playNotificationSound(soundType, priority);
    }
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    if (autoDismiss) {
      // Auto-remove after 10 seconds
      setTimeout(() => {
        removeNotification(baseId);
      }, 10000);
    }
  }, [removeNotification]);

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

  // Remove chat popup
  const removeChatPopup = useCallback((id) => {
    setChatPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const loadPersistedNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load general notifications from notifications table
      const generalNotifications = await notificationService.getNotifications({ limit: 50, userId: user.id });
      
      // Load task notifications from task_notifications table
      // user.id from useAuth() is the auth.users.id (auth_user_id)
      let taskNotifications = [];
      try {
        const { data: taskNotifs, error: taskNotifError } = await supabase
          .from('task_notifications')
          .select('*')
          .eq('user_id', user.id) // user.id is auth_user_id, task_notifications.user_id is auth.users.id
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (!taskNotifError && taskNotifs) {
          taskNotifications = taskNotifs.map(item => ({
            id: `task_${item.id}`, // Prefix to avoid ID conflicts
            type: item.type === 'assignment' ? 'task_assignment' : 
                  item.type === 'status_change' ? 'task_status_update' :
                  item.type === 'comment' ? 'task_comment' : 'task_notification',
            title: item.title,
            message: item.message,
            priority: 'high', // Task notifications are generally high priority
            data: {
              task_id: item.task_id,
              task_title: item.task?.title || '',
              task_status: item.task?.status || '',
              ...item
            },
            read: item.read ?? false,
            timestamp: item.created_at ? new Date(item.created_at) : new Date(),
            autoDismiss: false,
            source: 'task' // Mark as task notification
          }));
        }
      } catch (taskNotifErr) {
        console.warn('Error loading task notifications:', taskNotifErr);
      }

      // Map general notifications
      const mappedGeneralNotifications = Array.isArray(generalNotifications)
        ? generalNotifications.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            message: item.message,
            priority: item.priority,
            data: item.data,
            read: item.is_read ?? false,
            timestamp: item.created_at ? new Date(item.created_at) : new Date(),
            autoDismiss: false,
            source: 'general'
          }))
        : [];

      // Combine both types of notifications
      const allPersistedNotifications = [...mappedGeneralNotifications, ...taskNotifications];

      setNotifications(prev => {
        const persistedIds = new Set(allPersistedNotifications.map(item => item.id));
        const realtimeNotifications = prev.filter(n => !persistedIds.has(n.id));
        const combined = [...allPersistedNotifications, ...realtimeNotifications].sort(
          (a, b) => {
            const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp || Date.now()).getTime();
            const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp || Date.now()).getTime();
            return timeB - timeA;
          }
        );

        const unreadTotal = combined.filter(n => !n.read).length;
        setUnreadCount(unreadTotal);

        return combined;
      });
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // If it's a task notification, mark it as read in the database
    if (id.startsWith('task_')) {
      try {
        const taskNotifId = id.replace('task_', '');
        const { error } = await supabase
          .from('task_notifications')
          .update({ read: true })
          .eq('id', taskNotifId);
        
        if (error) {
          console.warn('Error marking task notification as read:', error);
        }
      } catch (error) {
        console.warn('Error marking task notification as read:', error);
      }
    } else {
      // Mark general notification as read
      try {
        await notificationService.markAsRead(id);
      } catch (error) {
        console.warn('Error marking notification as read:', error);
      }
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    // Mark all task notifications as read in database
    if (user) {
      try {
        // user.id is auth_user_id
        await supabase
          .from('task_notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      } catch (error) {
        console.warn('Error marking all task notifications as read:', error);
      }
      
      // Mark all general notifications as read
      try {
        await notificationService.markAllAsRead();
      } catch (error) {
        console.warn('Error marking all notifications as read:', error);
      }
    }
  }, [user]);

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
      try {
        await notificationService.setupAllNotifications((notification) => {
          addNotification(notification, { autoDismiss: false, preserveId: true, playSound: true });
        });
      } catch (error) {
        console.error('Error setting up notification service:', error);
      }

      // Subscribe to user-specific notification channels
      const userNotificationSub = supabase
        .channel(`user_${user.id}_notifications`)
        .on('broadcast', { event: 'notification' }, (payload) => {
          console.log('📨 Received user notification:', payload.payload);
          addNotification(payload.payload, { autoDismiss: false, preserveId: true, playSound: true });
        })
        .subscribe();
      subs.push(userNotificationSub);

      // Subscribe to task_notifications table for real-time updates
      // user.id is the auth_user_id
      const taskNotificationsSub = supabase
        .channel('task_notifications_realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'task_notifications',
          filter: `user_id=eq.${user.id}` // user.id is auth_user_id
        }, (payload) => {
            console.log('📨 New task notification received:', payload.new);
            const newNotif = {
              id: `task_${payload.new.id}`,
              type: payload.new.type === 'assignment' ? 'task_assignment' : 
                    payload.new.type === 'status_change' ? 'task_status_update' :
                    payload.new.type === 'comment' ? 'task_comment' : 'task_notification',
              title: payload.new.title,
              message: payload.new.message,
              priority: 'high',
              data: {
                task_id: payload.new.task_id,
                ...payload.new
              },
              read: payload.new.read ?? false,
              timestamp: payload.new.created_at ? new Date(payload.new.created_at) : new Date(),
              source: 'task'
            };
            addNotification(newNotif, { autoDismiss: false, preserveId: true, playSound: true });
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'task_notifications',
            filter: `user_id=eq.${user.id}` // user.id is auth_user_id
          }, (payload) => {
            // Update notification if it was marked as read
            if (payload.new.read && !payload.old.read) {
              setNotifications(prev => 
                prev.map(n => n.id === `task_${payload.new.id}` ? { ...n, read: true } : n)
              );
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          })
          .subscribe();
      subs.push(taskNotificationsSub);

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

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadPersistedNotifications();
  }, [user, loadPersistedNotifications]);

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

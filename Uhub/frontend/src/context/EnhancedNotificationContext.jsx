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
  const { conversations, setSelectedConversation } = useChat();
  
  // State for different notification types
  const [notifications, setNotifications] = useState([]);
  const [chatPopups, setChatPopups] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState([]);
  
  // Refs for cleanup
  const subscriptionsRef = useRef([]);
  const chatSubscriptionsRef = useRef([]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (user && 'Notification' in window) {
      requestNotificationPermission();
    }
  }, [user?.id, requestNotificationPermission]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadNotificationStats();
      loadNotificationPreferences();
      setupNotificationSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [user?.id, setupNotificationSubscriptions]);

  // Load notifications from database
  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications({ limit: 20 });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Load notification statistics
  const loadNotificationStats = async () => {
    try {
      const stats = await notificationService.getNotificationStats();
      setUnreadCount(stats.unread_notifications || 0);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  // Load notification preferences
  const loadNotificationPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      setNotificationPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

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
      timestamp: new Date(),
      index: chatPopups.length
    };
    
    setChatPopups(prev => [...prev, newPopup]);
  }, [chatPopups.length]);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Remove a chat popup
  const removeChatPopup = useCallback((id) => {
    setChatPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Handle viewing a conversation from chat popup
  const handleViewConversation = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
    }
  }, [conversations, setSelectedConversation]);

  // Setup notification subscriptions
  const setupNotificationSubscriptions = useCallback(async () => {
    if (!user) return;

    try {
      const subs = [];

      // Subscribe to new notifications
      const notificationSub = notificationService.subscribeToUserNotifications((payload) => {
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Play sound notification
          soundNotificationService.playNotificationSound(
            newNotification.type || 'default',
            newNotification.priority || 'medium'
          );
          
          // Show browser notification if permission granted
          showBrowserNotification(newNotification);
          
          // Show popup for high priority notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            addNotification({
              type: newNotification.type,
              title: newNotification.title,
              message: newNotification.message,
              priority: newNotification.priority,
              data: newNotification.data
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotification = payload.new;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      });
      subs.push(notificationSub);

      // Subscribe to complaints
      const complaintsSub = supabase
        .channel('complaints_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints'
        }, (payload) => {
          // Only notify if user is admin or HR manager
          if (user.role === 'admin' || user.role === 'hr_manager') {
            addNotification({
              type: 'complaint',
              title: 'New Complaint Submitted',
              message: `A new complaint has been submitted: ${payload.new.title}`,
              priority: payload.new.priority === 'urgent' ? 'urgent' : 
                       payload.new.priority === 'high' ? 'high' : 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(complaintsSub);

      // Subscribe to complaint updates
      const complaintUpdatesSub = supabase
        .channel('complaint_updates_notifications')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints'
        }, (payload) => {
          if (payload.new.requester_id === user.id) {
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

      // Subscribe to suggestions
      const suggestionsSub = supabase
        .channel('suggestions_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'suggestions'
        }, (payload) => {
          // Only notify if user is admin
          if (user.role === 'admin') {
            addNotification({
              type: 'suggestion',
              title: 'New Suggestion Submitted',
              message: `A new suggestion has been submitted: ${payload.new.title}`,
              priority: 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(suggestionsSub);

      // Subscribe to IT requests
      const itRequestsSub = supabase
        .channel('it_requests_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'it_requests'
        }, (payload) => {
          // Only notify if user is admin or IT manager
          if (user.role === 'admin' || user.role === 'it_management') {
            addNotification({
              type: 'it_request',
              title: 'New IT Request Created',
              message: `A new IT request has been created: ${payload.new.title}`,
              priority: 'high',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(itRequestsSub);

      // Subscribe to IT request updates
      const itRequestUpdatesSub = supabase
        .channel('it_request_updates_notifications')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'it_requests'
        }, (payload) => {
          if (payload.new.requester_id === user.id) {
            addNotification({
              type: 'it_request_update',
              title: 'IT Request Status Updated',
              message: `Your IT request "${payload.new.title}" status changed to ${payload.new.status}`,
              priority: 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();
      subs.push(itRequestUpdatesSub);

      // Subscribe to task assignments
      // Note: We can't filter by users.id directly in the subscription,
      // so we'll check in the callback
      const tasksSub = supabase
        .channel('tasks_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks'
        }, async (payload) => {
          const task = payload.new;
          
          // Get current user's users.id to match with task.assigned_to
          const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
          
          // Only notify if task is assigned to current user
          if (currentUser && task.assigned_to === currentUser.id) {
            // Create notification in database
            try {
              await notificationService.createNotification({
                userId: user.id,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned a new task: ${task.title}`,
                data: {
                  task_id: task.id,
                  task_title: task.title,
                  due_date: task.due_date,
                  priority: task.priority,
                  department: task.department
                },
                priority: task.priority === 'urgent' ? 'urgent' : 
                         task.priority === 'high' ? 'high' : 'medium',
                actionUrl: `/tasks`,
                actionLabel: 'View Task'
              });
            } catch (error) {
              console.warn('Error creating task notification:', error);
            }
            
            // Play sound notification
            soundNotificationService.playNotificationSound('task_assigned', task.priority || 'medium');
            
            // Show browser notification
            showBrowserNotification({
              type: 'task_assigned',
              title: 'New Task Assigned',
              message: `You have been assigned a new task: ${task.title}`,
              priority: task.priority || 'medium'
            });
          }
        })
        .subscribe();
      subs.push(tasksSub);

      // Subscribe to coordinated task assignees
      const taskAssigneesSub = supabase
        .channel('task_assignees_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'task_assignees'
        }, async (payload) => {
          const assignee = payload.new;
          
          // Get current user's users.id
          const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
          
          // Only notify if this assignee is the current user
          if (currentUser && assignee.user_id === currentUser.id) {
            // Get task details
            const { data: task } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', assignee.task_id)
              .single();
            
            if (task) {
              // Create notification
              try {
                await notificationService.createNotification({
                  userId: user.id,
                  type: 'task_assigned',
                  title: 'New Coordinated Task',
                  message: `You have been added to a coordinated task: ${task.title}`,
                  data: {
                    task_id: task.id,
                    task_title: task.title,
                    due_date: task.due_date,
                    priority: task.priority
                  },
                  priority: task.priority === 'urgent' ? 'urgent' : 
                           task.priority === 'high' ? 'high' : 'medium',
                  actionUrl: `/tasks`,
                  actionLabel: 'View Task'
                });
              } catch (error) {
                console.warn('Error creating task assignee notification:', error);
              }
              
              // Play sound notification
              soundNotificationService.playNotificationSound('task_assigned', task.priority || 'medium');
              
              // Show browser notification
              showBrowserNotification({
                type: 'task_assigned',
                title: 'New Coordinated Task',
                message: `You have been added to a coordinated task: ${task.title}`,
                priority: task.priority || 'medium'
              });
            }
          }
        })
        .subscribe();
      subs.push(taskAssigneesSub);

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

      subscriptionsRef.current = subs;
      setSubscriptions(subs);

    } catch (error) {
      console.error('Error setting up notification subscriptions:', error);
    }
  }, [user, addNotification, showBrowserNotification]);

  // Show browser notification
  const showBrowserNotification = useCallback(async (notification) => {
    try {
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission) {
        const icon = '/favicon.ico'; // You can customize this
        const badge = '/favicon.ico';
        
        const browserNotification = new Notification(notification.title || 'New Notification', {
          body: notification.message || '',
          icon: icon,
          badge: badge,
          tag: notification.type || 'notification',
          requireInteraction: notification.priority === 'urgent' || notification.priority === 'high',
          silent: false // Sound will be handled by soundNotificationService
        });

        // Handle click on notification
        browserNotification.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          browserNotification.close();
        };

        // Auto-close after 5 seconds (or 10 for urgent)
        setTimeout(() => {
          browserNotification.close();
        }, notification.priority === 'urgent' ? 10000 : 5000);
      }
    } catch (error) {
      console.warn('Error showing browser notification:', error);
    }
  }, [requestNotificationPermission]);

  // Check if user is participant in conversation before showing popup
  const checkConversationParticipation = useCallback(async (conversationId, message) => {
    try {
      const { data: participation } = await supabase
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (participation) {
        // Get conversation details
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        // Get sender details
        const { data: sender } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', message.sender_id)
          .single();

        // Show chat popup
        addChatPopup({
          type: 'chat_message',
          title: 'New Message',
          message: message.content,
          conversationId: conversationId,
          senderId: message.sender_id,
          senderName: sender?.full_name || 'Unknown User',
          conversationName: conversation?.name || 'Direct Message',
          attachments: message.attachments || []
        });
      }
    } catch (error) {
      console.error('Error checking conversation participation:', error);
    }
  }, [user.id, addChatPopup]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach(sub => {
      if (sub) {
        supabase.removeChannel(sub);
      }
    });
    subscriptionsRef.current = [];
    setSubscriptions([]);
  }, []);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (preferences) => {
    try {
      await notificationService.updateNotificationPreferences(preferences);
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }, []);

  // Create notification for specific users/roles
  const createNotification = useCallback(async (notificationData) => {
    try {
      return await notificationService.createNotification(notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, []);

  // Create notifications for role
  const createNotificationsForRole = useCallback(async (role, notificationData) => {
    try {
      return await notificationService.createNotificationsForRole({
        role,
        ...notificationData
      });
    } catch (error) {
      console.error('Error creating notifications for role:', error);
      throw error;
    }
  }, []);

  const value = {
    // State
    notifications,
    chatPopups,
    unreadCount,
    notificationPreferences,
    
    // Actions
    addNotification,
    addChatPopup,
    removeNotification,
    removeChatPopup,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    handleViewConversation,
    updateNotificationPreferences,
    createNotification,
    createNotificationsForRole,
    
    // Data loading
    loadNotifications,
    loadNotificationStats,
    loadNotificationPreferences
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

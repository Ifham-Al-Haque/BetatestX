import { supabase } from '../supabaseClient';

class NotificationService {
  constructor() {
    this.subscriptions = new Map();
  }

  // Create a single notification
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'medium',
    actionUrl = null,
    actionLabel = null,
    expiresAt = null
  }) {
    try {
      const { data: notification, error } = await supabase
        .rpc('create_notification', {
          p_user_id: userId,
          p_type: type,
          p_title: title,
          p_message: message,
          p_data: data,
          p_priority: priority,
          p_action_url: actionUrl,
          p_action_label: actionLabel,
          p_expires_at: expiresAt
        });

      if (error) throw error;
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notifications for multiple users
  async createNotificationsForUsers({
    userIds,
    type,
    title,
    message,
    data = {},
    priority = 'medium',
    actionUrl = null,
    actionLabel = null,
    expiresAt = null
  }) {
    try {
      const { data: count, error } = await supabase
        .rpc('create_notifications_for_users', {
          p_user_ids: userIds,
          p_type: type,
          p_title: title,
          p_message: message,
          p_data: data,
          p_priority: priority,
          p_action_url: actionUrl,
          p_action_label: actionLabel,
          p_expires_at: expiresAt
        });

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error creating notifications for users:', error);
      throw error;
    }
  }

  // Create notifications for users by role
  async createNotificationsForRole({
    role,
    type,
    title,
    message,
    data = {},
    priority = 'medium',
    actionUrl = null,
    actionLabel = null,
    expiresAt = null
  }) {
    try {
      const { data: count, error } = await supabase
        .rpc('create_notifications_for_role', {
          p_role: role,
          p_type: type,
          p_title: title,
          p_message: message,
          p_data: data,
          p_priority: priority,
          p_action_url: actionUrl,
          p_action_label: actionLabel,
          p_expires_at: expiresAt
        });

      if (error) throw error;
      return count;
    } catch (error) {
      console.error('Error creating notifications for role:', error);
      throw error;
    }
  }

  // Get notifications for current user
  async getNotifications({ limit = 50, offset = 0, unreadOnly = false } = {}) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_notification_stats');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count');

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .rpc('mark_notification_read', {
          p_notification_id: notificationId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_read');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('notification_type');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const updates = preferences.map(pref => ({
        notification_type: pref.notification_type,
        email_enabled: pref.email_enabled,
        push_enabled: pref.push_enabled,
        in_app_enabled: pref.in_app_enabled
      }));

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(updates, { onConflict: 'user_id,notification_type' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Subscribe to new notifications
  subscribeToNotifications(callback) {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, callback)
      .subscribe();

    this.subscriptions.set('notifications', channel);
    return channel;
  }

  // Subscribe to notification updates for current user
  subscribeToUserNotifications(callback) {
    const { data: { user } } = supabase.auth.getUser();
    const currentUserId = user?.id;
    if (!currentUserId) return null;

    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, callback)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, callback)
      .subscribe();

    this.subscriptions.set('user-notifications', channel);
    return channel;
  }

  // Setup all notification subscriptions
  async setupAllNotifications(addNotificationCallback) {
    try {
      // Subscribe to general notifications
      const generalSub = this.subscribeToUserNotifications((payload) => {
        if (payload.eventType === 'INSERT') {
          addNotificationCallback({
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            priority: payload.new.priority,
            data: payload.new.data
          });
        }
      });

      // Subscribe to system-wide notifications
      const systemSub = this.subscribeToNotifications((payload) => {
        if (payload.eventType === 'INSERT') {
          addNotificationCallback({
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            priority: payload.new.priority,
            data: payload.new.data
          });
        }
      });

      return [generalSub, systemSub].filter(Boolean);
    } catch (error) {
      console.error('Error setting up all notifications:', error);
      return [];
    }
  }

  // Cleanup subscriptions
  cleanup() {
    this.subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // Specific notification creators for different types

  // Complaint notifications
  async notifyComplaintCreated(complaint) {
    try {
      // Notify admins and HR managers
      const roles = ['admin', 'hr_manager'];
      let totalNotifications = 0;

      for (const role of roles) {
        const count = await this.createNotificationsForRole({
          role,
          type: 'complaint',
          title: 'New Complaint Submitted',
          message: `A new complaint has been submitted: ${complaint.title}`,
          data: {
            complaint_id: complaint.id,
            complaint_title: complaint.title,
            complaint_type: complaint.complaint_type,
            priority: complaint.priority,
            requester_id: complaint.requester_id
          },
          priority: complaint.priority === 'urgent' ? 'urgent' : 
                   complaint.priority === 'high' ? 'high' : 'medium',
          actionUrl: `/complaints/${complaint.id}`,
          actionLabel: 'View Complaint'
        });
        totalNotifications += count;
      }

      return totalNotifications;
    } catch (error) {
      console.error('Error notifying complaint creation:', error);
      throw error;
    }
  }

  async notifyComplaintStatusUpdate(complaint, oldStatus, newStatus) {
    try {
      // Notify the requester
      await this.createNotification({
        userId: complaint.requester_id,
        type: 'complaint_update',
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.title}" status has been updated from ${oldStatus} to ${newStatus}`,
        data: {
          complaint_id: complaint.id,
          complaint_title: complaint.title,
          old_status: oldStatus,
          new_status: newStatus
        },
        priority: 'medium',
        actionUrl: `/complaints/${complaint.id}`,
        actionLabel: 'View Complaint'
      });

      // Notify admins and HR managers
      const roles = ['admin', 'hr_manager'];
      let totalNotifications = 1;

      for (const role of roles) {
        const count = await this.createNotificationsForRole({
          role,
          type: 'complaint_update',
          title: 'Complaint Status Updated',
          message: `Complaint "${complaint.title}" status has been updated to ${newStatus}`,
          data: {
            complaint_id: complaint.id,
            complaint_title: complaint.title,
            old_status: oldStatus,
            new_status: newStatus
          },
          priority: 'medium',
          actionUrl: `/complaints/${complaint.id}`,
          actionLabel: 'View Complaint'
        });
        totalNotifications += count;
      }

      return totalNotifications;
    } catch (error) {
      console.error('Error notifying complaint status update:', error);
      throw error;
    }
  }

  // Suggestion notifications
  async notifySuggestionCreated(suggestion) {
    try {
      // Notify admins
      const count = await this.createNotificationsForRole({
        role: 'admin',
        type: 'suggestion',
        title: 'New Suggestion Submitted',
        message: `A new suggestion has been submitted: ${suggestion.title}`,
        data: {
          suggestion_id: suggestion.id,
          suggestion_title: suggestion.title,
          suggestion_type: suggestion.suggestion_type,
          requester_id: suggestion.requester_id
        },
        priority: 'medium',
        actionUrl: `/suggestions/${suggestion.id}`,
        actionLabel: 'View Suggestion'
      });

      return count;
    } catch (error) {
      console.error('Error notifying suggestion creation:', error);
      throw error;
    }
  }

  // IT Request notifications
  async notifyITRequestCreated(request) {
    try {
      // Notify IT managers and admins
      const roles = ['it_management', 'admin'];
      let totalNotifications = 0;

      for (const role of roles) {
        const count = await this.createNotificationsForRole({
          role,
          type: 'it_request',
          title: 'New IT Request Created',
          message: `A new IT request has been created: ${request.title}`,
          data: {
            request_id: request.id,
            request_title: request.title,
            request_type: request.request_type,
            priority: request.priority_id,
            requester_id: request.requester_id
          },
          priority: 'high', // IT requests are generally high priority
          actionUrl: `/it-requests/${request.id}`,
          actionLabel: 'View Request'
        });
        totalNotifications += count;
      }

      return totalNotifications;
    } catch (error) {
      console.error('Error notifying IT request creation:', error);
      throw error;
    }
  }

  async notifyITRequestStatusUpdate(request, oldStatus, newStatus) {
    try {
      // Notify the requester
      await this.createNotification({
        userId: request.requester_id,
        type: 'it_request_update',
        title: 'IT Request Status Updated',
        message: `Your IT request "${request.title}" status has been updated from ${oldStatus} to ${newStatus}`,
        data: {
          request_id: request.id,
          request_title: request.title,
          old_status: oldStatus,
          new_status: newStatus
        },
        priority: 'medium',
        actionUrl: `/it-requests/${request.id}`,
        actionLabel: 'View Request'
      });

      // Notify assigned user if different from requester
      if (request.assigned_to && request.assigned_to !== request.requester_id) {
        await this.createNotification({
          userId: request.assigned_to,
          type: 'it_request_update',
          title: 'Assigned Request Status Updated',
          message: `Request "${request.title}" status has been updated to ${newStatus}`,
          data: {
            request_id: request.id,
            request_title: request.title,
            old_status: oldStatus,
            new_status: newStatus
          },
          priority: 'medium',
          actionUrl: `/it-requests/${request.id}`,
          actionLabel: 'View Request'
        });
      }

      return 2; // Notified requester and assigned user
    } catch (error) {
      console.error('Error notifying IT request status update:', error);
      throw error;
    }
  }

  // Chat message notifications
  async notifyChatMessage(message, conversation, sender) {
    try {
      // Get conversation participants (excluding sender)
      const { data: participants, error } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation.id)
        .neq('user_id', sender.id);

      if (error) throw error;

      const userIds = participants.map(p => p.user_id);
      if (userIds.length === 0) return 0;

      const count = await this.createNotificationsForUsers({
        userIds,
        type: 'chat_message',
        title: 'New Chat Message',
        message: `You have received a new message from ${sender.full_name}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        data: {
          message_id: message.id,
          conversation_id: conversation.id,
          sender_id: sender.id,
          sender_name: sender.full_name,
          conversation_name: conversation.name
        },
        priority: 'low',
        actionUrl: `/chat?conversation=${conversation.id}`,
        actionLabel: 'View Message'
      });

      return count;
    } catch (error) {
      console.error('Error notifying chat message:', error);
      throw error;
    }
  }

  // Task notifications
  async notifyTaskAssigned(task, assigneeId) {
    try {
      await this.createNotification({
        userId: assigneeId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `A new task has been assigned to you: ${task.title}`,
        data: {
          task_id: task.id,
          task_title: task.title,
          due_date: task.due_date,
          priority: task.priority
        },
        priority: task.priority === 'high' ? 'high' : 'medium',
        actionUrl: `/tasks/${task.id}`,
        actionLabel: 'View Task'
      });

      return 1;
    } catch (error) {
      console.error('Error notifying task assignment:', error);
      throw error;
    }
  }

  // System notifications
  async notifySystemMaintenance(maintenanceInfo) {
    try {
      const count = await this.createNotificationsForRole({
        role: 'admin', // You can change this to notify all users
        type: 'system_maintenance',
        title: 'System Maintenance Scheduled',
        message: `Scheduled system maintenance will occur on ${maintenanceInfo.date} from ${maintenanceInfo.startTime} to ${maintenanceInfo.endTime}`,
        data: {
          maintenance_date: maintenanceInfo.date,
          start_time: maintenanceInfo.startTime,
          end_time: maintenanceInfo.endTime,
          description: maintenanceInfo.description
        },
        priority: 'medium',
        actionUrl: '/maintenance',
        actionLabel: 'View Details'
      });

      return count;
    } catch (error) {
      console.error('Error notifying system maintenance:', error);
      throw error;
    }
  }

  // Security alert notifications
  async notifySecurityAlert(alertInfo) {
    try {
      const count = await this.createNotificationsForRole({
        role: 'admin',
        type: 'security_alert',
        title: 'Security Alert',
        message: `Security alert: ${alertInfo.message}`,
        data: {
          alert_type: alertInfo.type,
          severity: alertInfo.severity,
          details: alertInfo.details
        },
        priority: 'urgent',
        actionUrl: '/security',
        actionLabel: 'View Alert'
      });

      return count;
    } catch (error) {
      console.error('Error notifying security alert:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
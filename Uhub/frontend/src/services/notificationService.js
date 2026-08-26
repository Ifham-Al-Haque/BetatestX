import { supabase } from '../supabaseClient';
import { sendPushToUser, sendPushToRoles } from './pushService';
import {
  IT_NOTIFY_ROLES,
  HR_NOTIFY_ROLES,
  getCurrentActor,
  notifyUhubUser,
  notifyUhubUsersByRoles,
  getUhubUsersByRoles,
} from './unifiedNotify';

class NotificationService {
  constructor() {
    this.subscriptions = new Map();
  }

  // Client-side fallback when create_notifications_for_role RPC fails.
  async _notifyRoleViaUsersTable(role, payload) {
    const users = await getUhubUsersByRoles([role]);
    let count = 0;
    for (const u of users) {
      const authId = u.auth_user_id || u.id;
      if (!authId) continue;
      const n = await this.createNotification({ ...payload, userId: authId });
      if (n) count += 1;
    }
    return count;
  }

  // Best-effort browser/native push for a single user (auth id). No-ops if push unconfigured.
  _dispatchPush(userId, { title, message, actionUrl } = {}) {
    if (!userId || !title) return;
    try {
      sendPushToUser(userId, { title, message, url: actionUrl || undefined }).catch(() => {});
    } catch {
      /* noop */
    }
  }

  // Best-effort push to every user holding a given role (resolved server-side).
  async _dispatchPushToRole(role, { title, message, actionUrl } = {}) {
    if (!role || !title) return;
    try {
      sendPushToRoles([role], { title, message, url: actionUrl || undefined }).catch(() => {});
    } catch {
      /* noop */
    }
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
    if (!userId) return null;

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
      this._dispatchPush(userId, { title, message, actionUrl });
      return notification;
    } catch (error) {
      console.error(
        'In-app notification NOT saved. Direct inserts are disabled; run 20260826_uhub_security_hardening.sql.',
        error?.message || error
      );
      this._dispatchPush(userId, { title, message, actionUrl });
      return null;
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
    if (!userIds?.length) return 0;

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
      (userIds || []).forEach((id) => this._dispatchPush(id, { title, message, actionUrl }));
      return count;
    } catch (error) {
      console.warn('create_notifications_for_users RPC failed:', error?.message || error);
      let count = 0;
      for (const id of userIds) {
        const n = await this.createNotification({
          userId: id, type, title, message, data, priority, actionUrl, actionLabel, expiresAt
        });
        if (n) count += 1;
      }
      return count;
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
    const payload = { type, title, message, data, priority, actionUrl, actionLabel, expiresAt };

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
      this._dispatchPushToRole(role, { title, message, actionUrl });
      return count;
    } catch (error) {
      console.warn('create_notifications_for_role RPC failed, using users table fallback:', error?.message || error);
      const count = await this._notifyRoleViaUsersTable(role, payload);
      this._dispatchPushToRole(role, { title, message, actionUrl });
      return count;
    }
  }

  // Get notifications for current user (pass userId to only load that user's notifications)
  async getNotifications({ limit = 50, offset = 0, unreadOnly = false, userId = null } = {}) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }
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
  async subscribeToUserNotifications(callback) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
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
    } catch (error) {
      console.error('Error subscribing to user notifications:', error);
      return null;
    }
  }

  // Setup all notification subscriptions
  async setupAllNotifications(addNotificationCallback) {
    try {
      // Subscribe to general notifications (INSERT only: new row → show alert + play sound)
      const generalSub = await this.subscribeToUserNotifications((payload) => {
        const isInsert = payload?.eventType === 'INSERT' || (payload?.new && payload?.old == null);
        const row = payload?.new;
        if (isInsert && row) {
          addNotificationCallback({
            id: row.id,
            type: row.type,
            title: row.title,
            message: row.message,
            priority: row.priority || 'medium',
            data: row.data,
            timestamp: row.created_at,
            read: row.is_read ?? false
          });
        }
      });

      // Subscribe to system-wide notifications
      const systemSub = this.subscribeToNotifications((payload) => {
        const row = payload?.new;
        if (row) {
          addNotificationCallback({
            id: row.id,
            type: row.type,
            title: row.title,
            message: row.message,
            priority: row.priority || 'medium',
            data: row.data,
            timestamp: row.created_at,
            read: row.is_read ?? false
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
      const actionUrl = `/complaints/${complaint.id}`;
      const priority = complaint.priority === 'urgent' ? 'urgent'
        : complaint.priority === 'high' ? 'high' : 'medium';
      const emailLines = [
        { label: 'Title', value: complaint.title },
        { label: 'Category', value: complaint.category },
        { label: 'Priority', value: complaint.priority },
        { label: 'Status', value: complaint.status || 'open' },
      ];

      const result = await notifyUhubUsersByRoles(this, HR_NOTIFY_ROLES, {
        type: 'complaint',
        title: 'New Complaint Submitted',
        message: `A new complaint has been submitted: ${complaint.title}`,
        data: {
          complaint_id: complaint.id,
          complaint_title: complaint.title,
          complaint_type: complaint.category,
          priority: complaint.priority,
          requester_id: complaint.complainant_id,
        },
        priority,
        actionUrl,
        actionLabel: 'View Complaint',
        emailSubject: `UHub Complaint: ${complaint.title}`,
        emailHeading: 'New Complaint Submitted',
        emailLines,
        emailAccentColor: '#7c3aed',
      });

      return result.inApp + result.push;
    } catch (error) {
      console.error('Error notifying complaint creation:', error);
      throw error;
    }
  }

  async notifyComplaintStatusUpdate(complaint, oldStatus, newStatus) {
    try {
      const actionUrl = `/complaints/${complaint.id}`;
      const requesterId = complaint.complainant_id || complaint.requester_id;

      if (requesterId) {
        await notifyUhubUser(this, {
          personId: requesterId,
          type: 'complaint_update',
          title: 'Complaint Status Updated',
          message: `Your complaint "${complaint.title}" status changed from ${oldStatus} to ${newStatus}`,
          data: {
            complaint_id: complaint.id,
            complaint_title: complaint.title,
            old_status: oldStatus,
            new_status: newStatus,
          },
          priority: 'medium',
          actionUrl,
          actionLabel: 'View Complaint',
          emailSubject: `Complaint update: ${complaint.title}`,
          emailLines: [
            { label: 'Previous status', value: oldStatus },
            { label: 'New status', value: newStatus },
          ],
          emailAccentColor: '#7c3aed',
        });
      }

      const teamResult = await notifyUhubUsersByRoles(this, HR_NOTIFY_ROLES, {
        type: 'complaint_update',
        title: 'Complaint Status Updated',
        message: `Complaint "${complaint.title}" status updated to ${newStatus}`,
        data: {
          complaint_id: complaint.id,
          complaint_title: complaint.title,
          old_status: oldStatus,
          new_status: newStatus,
        },
        priority: 'medium',
        actionUrl,
        actionLabel: 'View Complaint',
        emailSubject: `Complaint status: ${complaint.title} → ${newStatus}`,
        emailLines: [
          { label: 'Previous status', value: oldStatus },
          { label: 'New status', value: newStatus },
        ],
        emailAccentColor: '#7c3aed',
      });

      return 1 + teamResult.inApp;
    } catch (error) {
      console.error('Error notifying complaint status update:', error);
      throw error;
    }
  }

  // Suggestion notifications
  async notifySuggestionCreated(suggestion) {
    try {
      const actionUrl = `/suggestions/${suggestion.id}`;
      const result = await notifyUhubUsersByRoles(this, ['admin', 'super_admin'], {
        type: 'suggestion',
        title: 'New Suggestion Submitted',
        message: `A new suggestion has been submitted: ${suggestion.title}`,
        data: {
          suggestion_id: suggestion.id,
          suggestion_title: suggestion.title,
          suggestion_type: suggestion.suggestion_type,
          requester_id: suggestion.suggester_id,
        },
        priority: 'medium',
        actionUrl,
        actionLabel: 'View Suggestion',
        emailSubject: `UHub Suggestion: ${suggestion.title}`,
        emailLines: [
          { label: 'Title', value: suggestion.title },
          { label: 'Category', value: suggestion.category },
          { label: 'Type', value: suggestion.suggestion_type },
        ],
        emailAccentColor: '#2563eb',
      });

      return result.inApp;
    } catch (error) {
      console.error('Error notifying suggestion creation:', error);
      throw error;
    }
  }

  // IT Request notifications
  async notifyITRequestCreated(request) {
    try {
      const actionUrl = `/request-inbox${request.id ? `?view=${request.id}` : ''}`;
      const emailLines = [
        { label: 'Title', value: request.title },
        { label: 'Request ID', value: request.request_number || request.id },
        { label: 'Status', value: request.status || 'open' },
      ];

      const result = await notifyUhubUsersByRoles(this, IT_NOTIFY_ROLES, {
        type: 'it_request',
        title: 'New IT Request Created',
        message: `A new IT request has been created: ${request.title}`,
        data: {
          request_id: request.id,
          request_title: request.title,
          request_type: request.request_type,
          priority: request.priority_id,
          requester_id: request.requester_id,
        },
        priority: 'high',
        actionUrl,
        actionLabel: 'View Request',
        emailSubject: `UHub IT Request: ${request.title}`,
        emailHeading: 'New IT Request',
        emailLines,
        emailAccentColor: '#0d9488',
      });

      return result.inApp + result.push;
    } catch (error) {
      console.error('Error notifying IT request creation:', error);
      throw error;
    }
  }

  async notifyITRequestStatusUpdate(request, oldStatus, newStatus) {
    try {
      const actionUrl = `/it-requests/${request.id}`;

      if (request.requester_id) {
        await notifyUhubUser(this, {
          personId: request.requester_id,
          type: 'it_request_update',
          title: 'IT Request Status Updated',
          message: `Your IT request "${request.title}" changed from ${oldStatus} to ${newStatus}`,
          data: {
            request_id: request.id,
            request_title: request.title,
            old_status: oldStatus,
            new_status: newStatus,
          },
          priority: 'medium',
          actionUrl,
          actionLabel: 'View Request',
          emailSubject: `IT Request update: ${request.title}`,
          emailLines: [
            { label: 'Previous status', value: oldStatus },
            { label: 'New status', value: newStatus },
          ],
          emailAccentColor: '#0d9488',
        });
      }

      if (request.assigned_to && String(request.assigned_to) !== String(request.requester_id)) {
        await notifyUhubUser(this, {
          personId: request.assigned_to,
          type: 'it_request_update',
          title: 'Assigned Request Status Updated',
          message: `Request "${request.title}" status updated to ${newStatus}`,
          data: {
            request_id: request.id,
            request_title: request.title,
            old_status: oldStatus,
            new_status: newStatus,
          },
          priority: 'medium',
          actionUrl: `/request-inbox${request.id ? `?view=${request.id}` : ''}`,
          actionLabel: 'View Request',
          channels: { inApp: true, push: true, email: false },
        });
      }

      return 2;
    } catch (error) {
      console.error('Error notifying IT request status update:', error);
      throw error;
    }
  }

  /**
   * Notify assignee when an IT request is assigned (in-app + push + email).
   */
  async sendITRequestAssignmentNotification(request) {
    const assigneeUserId = request?.assigned_to;
    if (!assigneeUserId) return 0;

    try {
      const assignedBy = await getCurrentActor();
      const actionUrl = `/request-inbox${request.id ? `?view=${request.id}` : ''}`;

      const result = await notifyUhubUser(this, {
        personId: assigneeUserId,
        type: 'it_request_assigned',
        title: 'IT Request Assigned to You',
        message: `You have been assigned to request: ${request.title}`,
        data: {
          request_id: request.id,
          request_title: request.title,
          request_number: request.request_number,
          assigned_by: assignedBy.fullName,
        },
        priority: 'high',
        actionUrl,
        actionLabel: 'View Request',
        emailSubject: `IT Request Assigned: ${request.title}`,
        emailHeading: 'IT Request Assigned',
        emailIntro: `Hi, you have been assigned an IT request by ${assignedBy.fullName}.`,
        emailLines: [
          { label: 'Request', value: request.title },
          { label: 'Request ID', value: request.request_number || request.id },
          { label: 'Assigned by', value: assignedBy.fullName },
        ],
        emailAccentColor: '#0d9488',
      });

      return result.inApp || result.push || result.email ? 1 : 0;
    } catch (err) {
      console.error('Failed to send assignment notification:', err);
      return 0;
    }
  }

  /** @deprecated Use sendITRequestAssignmentNotification */
  async notifyITRequestAssigned(request, assigneeUserId, assigneeEmail, assignedByUser) {
    return this.sendITRequestAssignmentNotification({
      ...request,
      assigned_to: assigneeUserId || request.assigned_to,
    });
  }

  /** Notify fleet maintenance assignee (in-app + push + email). */
  async sendFleetTaskAssignmentNotification(ticket) {
    const assigneeId = ticket?.assigned_to;
    if (!assigneeId) return 0;

    try {
      const vehicleLabel = ticket.fleet_vehicles?.vehicle_number || ticket.vehicle_number || '';
      const taskTitle = ticket.title || ticket.ticket_number || 'Fleet maintenance task';
      const actionUrl = '/operation/fleetio/maintenance';
      const isHigh = ['High', 'Critical', 'Urgent'].includes(ticket.priority);

      const result = await notifyUhubUser(this, {
        personId: assigneeId,
        type: 'fleet_task_assigned',
        title: 'Fleet Task Assigned to You',
        message: `You have been assigned: ${taskTitle}${vehicleLabel ? ` (${vehicleLabel})` : ''}`,
        data: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          vehicle: vehicleLabel,
        },
        priority: isHigh ? 'high' : 'medium',
        actionUrl,
        actionLabel: 'View Task',
        emailSubject: `Fleet Task Assigned: ${taskTitle}`,
        emailHeading: 'Fleet Maintenance Task Assigned',
        emailLines: [
          { label: 'Task', value: taskTitle },
          { label: 'Ticket', value: ticket.ticket_number },
          { label: 'Vehicle', value: vehicleLabel },
          { label: 'Priority', value: ticket.priority },
        ].filter((l) => l.value),
        emailAccentColor: '#2563eb',
      });

      return result.inApp || result.push || result.email ? 1 : 0;
    } catch (err) {
      console.error('Failed to send fleet task assignment notification:', err);
      return 0;
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
  async notifyTaskAssigned(task, assigneeId, assignedByName) {
    try {
      const actionUrl = `/tasks/${task.id}`;
      const result = await notifyUhubUser(this, {
        personId: assigneeId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `A new task has been assigned to you: ${task.title}`,
        data: {
          task_id: task.id,
          task_title: task.title,
          due_date: task.due_date,
          priority: task.priority,
        },
        priority: task.priority === 'high' ? 'high' : 'medium',
        actionUrl,
        actionLabel: 'View Task',
        emailSubject: `Task assigned: ${task.title}`,
        emailIntro: assignedByName
          ? `${assignedByName} assigned you a task.`
          : 'You have been assigned a new task.',
        emailLines: [
          { label: 'Task', value: task.title },
          { label: 'Due date', value: task.due_date },
          { label: 'Priority', value: task.priority },
        ].filter((l) => l.value),
        emailAccentColor: '#059669',
      });

      return result.inApp || result.push || result.email ? 1 : 0;
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

  async notifyRegularizationSubmitted(request) {
    try {
      const dateLabel = request.work_date || '';
      const name = request.requester_name || request.requester_email || 'A UHub user';
      const actionUrl = '/attendance?tab=regularization';
      const payload = {
        type: 'attendance_regularization',
        title: 'Attendance regularization request',
        message: `${name} asked to regularize ${dateLabel}`,
        data: {
          request_id: request.id,
          work_date: request.work_date,
          requester_id: request.user_id,
        },
        priority: 'high',
        actionUrl,
        actionLabel: 'Review request',
        emailSubject: `Attendance regularization: ${name}`,
        emailHeading: 'New regularization request',
        emailLines: [
          { label: 'Requester', value: name },
          { label: 'Date', value: dateLabel },
          { label: 'Reason', value: request.reason },
        ],
        emailAccentColor: '#4f46e5',
      };
      const result = await notifyUhubUsersByRoles(this, HR_NOTIFY_ROLES, payload);
      return result.inApp + result.push;
    } catch (error) {
      console.error('Error notifying regularization submit:', error);
      return 0;
    }
  }

  async notifyRegularizationReviewed(request, decision) {
    try {
      const approved = decision === 'approved';
      const dateLabel = request.work_date || '';
      const personId = request.requester_auth_id || request.user_id;
      if (personId) {
        await notifyUhubUser(this, {
          personId,
          type: 'attendance_regularization_update',
          title: approved ? 'Regularization approved' : 'Regularization rejected',
          message: approved
            ? `HR approved your attendance regularization for ${dateLabel}`
            : `HR rejected your attendance regularization for ${dateLabel}`,
          data: {
            request_id: request.id,
            work_date: request.work_date,
            status: decision,
            review_notes: request.review_notes,
          },
          priority: 'high',
          actionUrl: '/home',
          actionLabel: 'Open time clock',
          emailSubject: approved
            ? `Regularization approved: ${dateLabel}`
            : `Regularization rejected: ${dateLabel}`,
          emailLines: [
            { label: 'Date', value: dateLabel },
            { label: 'Decision', value: approved ? 'Approved' : 'Rejected' },
            { label: 'HR note', value: request.review_notes },
          ],
          emailAccentColor: approved ? '#059669' : '#e11d48',
        });
      }
      return 1;
    } catch (error) {
      console.error('Error notifying regularization review:', error);
      return 0;
    }
  }

  async notifyLeaveSubmitted(request) {
    try {
      const name = request.requester_name || request.requester_email || 'A UHub user';
      const actionUrl = '/leave';
      const payload = {
        type: 'leave_request',
        title: 'Leave request submitted',
        message: `${name} requested ${request.leave_type} leave (${request.start_date} → ${request.end_date})`,
        data: {
          request_id: request.id,
          leave_type: request.leave_type,
          requester_id: request.user_id,
        },
        priority: 'high',
        actionUrl,
        actionLabel: 'Review leave',
        emailSubject: `Leave request: ${name}`,
        emailHeading: 'New leave request',
        emailLines: [
          { label: 'Requester', value: name },
          { label: 'Type', value: request.leave_type },
          { label: 'From', value: request.start_date },
          { label: 'To', value: request.end_date },
          { label: 'Reason', value: request.reason },
        ],
        emailAccentColor: '#0d9488',
      };
      const result = await notifyUhubUsersByRoles(this, HR_NOTIFY_ROLES, payload);
      return result.inApp + result.push;
    } catch (error) {
      console.error('Error notifying leave submit:', error);
      return 0;
    }
  }

  async notifyLeaveReviewed(request, decision) {
    try {
      const approved = decision === 'approved';
      const personId = request.requester_auth_id || request.user_id;
      if (personId) {
        await notifyUhubUser(this, {
          personId,
          type: 'leave_request_update',
          title: approved ? 'Leave approved' : 'Leave rejected',
          message: approved
            ? `HR approved your ${request.leave_type} leave (${request.start_date})`
            : `HR rejected your ${request.leave_type} leave (${request.start_date})`,
          data: {
            request_id: request.id,
            status: decision,
            review_notes: request.review_notes,
          },
          priority: 'high',
          actionUrl: '/home',
          actionLabel: 'Open leave',
          emailSubject: approved ? 'Leave approved' : 'Leave rejected',
          emailLines: [
            { label: 'Type', value: request.leave_type },
            { label: 'From', value: request.start_date },
            { label: 'To', value: request.end_date },
            { label: 'Decision', value: approved ? 'Approved' : 'Rejected' },
            { label: 'HR note', value: request.review_notes },
          ],
          emailAccentColor: approved ? '#059669' : '#e11d48',
        });
      }
      return 1;
    } catch (error) {
      console.error('Error notifying leave review:', error);
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
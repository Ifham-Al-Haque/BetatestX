import { supabase } from '../supabaseClient';
import { emailService } from './emailService';
import { sendPushToUser } from './pushService';

class NotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.createNotificationAvailable = true;
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

  // Best-effort push to every user holding a given role.
  async _dispatchPushToRole(role, { title, message, actionUrl } = {}) {
    if (!role || !title) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('role', role);
      if (error || !data) return;
      data.forEach((u) => {
        if (u.auth_user_id) this._dispatchPush(u.auth_user_id, { title, message, actionUrl });
      });
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
    if (!this.createNotificationAvailable) {
      return null;
    }

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
      console.warn('Notification service: disabling create_notification RPC due to error:', error);
      this.createNotificationAvailable = false;
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
    if (!this.createNotificationAvailable) {
      return 0;
    }

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
      console.warn('Notification service: disabling create_notification RPC due to error:', error);
      this.createNotificationAvailable = false;
      return 0;
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
    if (!this.createNotificationAvailable) {
      return 0;
    }

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
      console.warn('Notification service: disabling create_notification RPC due to error:', error);
      this.createNotificationAvailable = false;
      return 0;
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
      // Notify IT managers and admins (include both role name variants used in the app)
      const roles = ['it_management', 'it_manager', 'it', 'admin'];
      const seen = new Set();
      let totalNotifications = 0;

      for (const role of roles) {
        if (seen.has(role)) continue;
        seen.add(role);
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

  /**
   * Fetch assignee + current user and send assignment notification (in-app + email).
   * Call this after an IT request is assigned; no need to resolve emails yourself.
   * @param {Object} request - Updated request (id, title, request_number, assigned_to, priority optional)
   */
  async sendITRequestAssignmentNotification(request) {
    const assigneeUserId = request?.assigned_to;
    if (!assigneeUserId) return 0;
    try {
      // Resolve assignee: try users.id, users.auth_user_id, employees.id, employees.auth_user_id (assignee may be from users or employees)
      let assignee = null;
      let notificationUserId = assigneeUserId; // For in-app: use auth_user_id when available so the notification shows for the logged-in user
      const [byUsersId, byUsersAuth, byEmpId, byEmpAuth] = await Promise.all([
        supabase.from('users').select('id, auth_user_id, email, full_name').eq('id', assigneeUserId).maybeSingle(),
        supabase.from('users').select('id, auth_user_id, email, full_name').eq('auth_user_id', assigneeUserId).maybeSingle(),
        supabase.from('employees').select('id, auth_user_id, email, full_name').eq('id', assigneeUserId).maybeSingle(),
        supabase.from('employees').select('id, auth_user_id, email, full_name').eq('auth_user_id', assigneeUserId).maybeSingle()
      ]);
      const u = byUsersId.data || byUsersAuth.data || byEmpId.data || byEmpAuth.data;
      if (u) {
        assignee = { email: u.email, full_name: u.full_name };
        if (u.auth_user_id) notificationUserId = u.auth_user_id; // Prefer auth user id for notification delivery
      }
      if (!assignee?.email) {
        console.warn('Assignment notification skipped: no assignee email found for id', assigneeUserId);
        return 0;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      let assignedBy = { full_name: 'IT Team', email: '' };
      if (authUser?.id) {
        const cur = (await supabase.from('users').select('full_name, email').eq('id', authUser.id).maybeSingle()).data
          || (await supabase.from('users').select('full_name, email').eq('auth_user_id', authUser.id).maybeSingle()).data
          || (await supabase.from('employees').select('full_name, email').eq('auth_user_id', authUser.id).maybeSingle()).data;
        if (cur) assignedBy = { full_name: cur.full_name || cur.email, email: cur.email || '' };
      }

      return await this.notifyITRequestAssigned(request, notificationUserId, assignee.email, assignedBy);
    } catch (err) {
      console.error('Failed to send assignment notification:', err);
      return 0;
    }
  }

  /**
   * Notify assignee when an IT request is assigned to them (in-app + email).
   * @param {Object} request - Updated request (id, title, request_number, priority, assignee optional)
   * @param {string} assigneeUserId - User ID of the assignee (for in-app notification)
   * @param {string} assigneeEmail - Email address to send assignment email to
   * @param {Object} assignedByUser - { full_name, email } of the user who performed the assignment
   */
  async notifyITRequestAssigned(request, assigneeUserId, assigneeEmail, assignedByUser) {
    const email = assigneeEmail && String(assigneeEmail).trim();
    if (!email) {
      console.warn('Cannot send assignment notification: no assignee email');
      return 0;
    }
    try {
      // In-app notification for assignee (RPC may not exist; continue to email either way)
      try {
        await this.createNotification({
          userId: assigneeUserId,
          type: 'it_request_assigned',
          title: 'IT Request Assigned to You',
          message: `You have been assigned to request: ${request.title}`,
          data: {
            request_id: request.id,
            request_title: request.title,
            request_number: request.request_number,
            assigned_by: assignedByUser?.full_name || assignedByUser?.email
          },
          priority: 'high',
          actionUrl: `/request-inbox` + (request.id ? `?view=${request.id}` : ''),
          actionLabel: 'View Request'
        });
      } catch (e) {
        console.warn('In-app notification failed (create_notification RPC may be missing):', e?.message);
      }

      // Email notification to assignee (always attempt when we have email)
      try {
        const result = await emailService.sendAssignmentNotification(request, email, assignedByUser || { full_name: 'IT Team', email: '' });
        if (result?.success) {
          console.log('Assignment email sent to', email);
        } else {
          console.warn('Assignment email result:', result?.message || 'unknown');
        }
      } catch (emailErr) {
        console.error('Failed to send assignment email:', emailErr);
      }

      return 1;
    } catch (error) {
      console.error('Error notifying IT request assignment:', error);
      throw error;
    }
  }

  /**
   * Notify the assignee of a fleet maintenance task/ticket (in-app + email + push).
   * Resolves the assignee from users/employees (assigned_to may be an employee id).
   * @param {Object} ticket - { id, title, ticket_number, assigned_to, priority, vehicle_id, fleet_vehicles? }
   */
  async sendFleetTaskAssignmentNotification(ticket) {
    const assigneeId = ticket?.assigned_to;
    if (!assigneeId) return 0;
    try {
      // Resolve assignee (UDrive employee OR UHub user). For in-app we need the auth id.
      let assigneeEmail = null;
      let assigneeName = null;
      let notificationUserId = assigneeId;
      const [byUsersId, byUsersAuth, byEmpId, byEmpAuth] = await Promise.all([
        supabase.from('users').select('id, auth_user_id, email, full_name').eq('id', assigneeId).maybeSingle(),
        supabase.from('users').select('id, auth_user_id, email, full_name').eq('auth_user_id', assigneeId).maybeSingle(),
        supabase.from('employees').select('id, auth_user_id, email, full_name').eq('id', assigneeId).maybeSingle(),
        supabase.from('employees').select('id, auth_user_id, email, full_name').eq('auth_user_id', assigneeId).maybeSingle(),
      ]);
      const u = byUsersId.data || byUsersAuth.data || byEmpId.data || byEmpAuth.data;
      if (u) {
        assigneeEmail = u.email;
        assigneeName = u.full_name;
        if (u.auth_user_id) notificationUserId = u.auth_user_id;
      }

      const vehicleLabel = ticket.fleet_vehicles?.vehicle_number || ticket.vehicle_number || '';
      const taskTitle = ticket.title || ticket.ticket_number || 'Fleet maintenance task';
      const actionUrl = '/operation/fleetio/maintenance';
      const isHigh = ['High', 'Critical', 'Urgent'].includes(ticket.priority);

      // 1) In-app notification
      if (notificationUserId) {
        try {
          await this.createNotification({
            userId: notificationUserId,
            type: 'fleet_task_assigned',
            title: 'Fleet Task Assigned to You',
            message: `You have been assigned a fleet maintenance task: ${taskTitle}${vehicleLabel ? ` (${vehicleLabel})` : ''}`,
            data: {
              ticket_id: ticket.id,
              ticket_number: ticket.ticket_number,
              vehicle: vehicleLabel,
            },
            priority: isHigh ? 'high' : 'medium',
            actionUrl,
            actionLabel: 'View Task',
          });
        } catch (e) {
          console.warn('Fleet in-app notification failed (create_notification RPC may be missing):', e?.message);
        }
      }

      // 2) Email notification
      if (assigneeEmail && String(assigneeEmail).trim()) {
        const subject = `Fleet Task Assigned: ${taskTitle}`;
        const body = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
            <div style="background: #2563eb; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">Fleet Maintenance Task Assigned</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa; color: #111;">
              <p>Hi ${assigneeName || 'there'},</p>
              <p>You have been assigned a fleet maintenance task.</p>
              <p><strong>Task:</strong> ${taskTitle}</p>
              ${ticket.ticket_number ? `<p><strong>Ticket:</strong> ${ticket.ticket_number}</p>` : ''}
              ${vehicleLabel ? `<p><strong>Vehicle:</strong> ${vehicleLabel}</p>` : ''}
              ${ticket.priority ? `<p><strong>Priority:</strong> ${ticket.priority}</p>` : ''}
              <div style="text-align:center; margin: 24px 0;">
                <a href="${(typeof window !== 'undefined' ? window.location.origin : '')}${actionUrl}" style="background:#2563eb; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">View Task</a>
              </div>
            </div>
            <div style="background:#f1f5f9; padding:12px; text-align:center; color:#64748b; font-size:12px;">Automated notification from Udrive Fleet.</div>
          </div>`;
        try {
          await emailService.sendNotification(assigneeEmail, subject, body);
        } catch (emailErr) {
          console.error('Fleet assignment email failed:', emailErr);
        }
      } else {
        console.warn('Fleet assignment email skipped: no email found for assignee', assigneeId);
      }

      // Push is dispatched centrally by createNotification() above.
      return 1;
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
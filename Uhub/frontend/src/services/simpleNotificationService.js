import { supabase } from '../supabaseClient';
import { emailService } from './emailService';

class SimpleNotificationService {
  constructor() {
    this.subscriptions = new Map();
  }

  parseEmailList(value) {
    return String(value || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  getConfiguredEmails(envKey, fallbackList = []) {
    const envValue = process.env[envKey];
    if (!envValue) return fallbackList;
    return this.parseEmailList(envValue);
  }

  dedupeEmails(emails) {
    return [...new Set((emails || []).map((email) => String(email || '').trim().toLowerCase()).filter(Boolean))];
  }

  async sendEmailAlert(recipients, subject, body) {
    const emailList = this.dedupeEmails(recipients);
    if (emailList.length === 0) return { sent: 0, failed: 0 };

    const results = await Promise.allSettled(
      emailList.map((email) => emailService.sendNotification(email, subject, body))
    );

    const sent = results.filter(
      (result) => result.status === 'fulfilled' && result.value?.success
    ).length;
    return { sent, failed: emailList.length - sent };
  }

  buildComplaintEmailBody(complaint) {
    return `
      <p>A new complaint has been submitted in UHub.</p>
      <p><strong>Title:</strong> ${complaint.title || 'N/A'}</p>
      <p><strong>Category:</strong> ${complaint.category || 'N/A'}</p>
      <p><strong>Priority:</strong> ${complaint.priority || 'medium'}</p>
      <p><strong>Status:</strong> ${complaint.status || 'open'}</p>
      <p><strong>Submitted at:</strong> ${new Date(complaint.created_at || Date.now()).toLocaleString()}</p>
      <p>Please review this complaint in UHub.</p>
    `;
  }

  buildSuggestionEmailBody(suggestion) {
    return `
      <p>A new suggestion has been submitted in UHub.</p>
      <p><strong>Title:</strong> ${suggestion.title || 'N/A'}</p>
      <p><strong>Category:</strong> ${suggestion.category || 'N/A'}</p>
      <p><strong>Priority:</strong> ${suggestion.priority || 'medium'}</p>
      <p><strong>Type:</strong> ${suggestion.suggestion_type || 'general'}</p>
      <p><strong>Submitted at:</strong> ${new Date(suggestion.created_at || Date.now()).toLocaleString()}</p>
      <p>Please review this suggestion in UHub.</p>
    `;
  }

  buildITRequestEmailBody(request) {
    return `
      <p>A new IT request has been submitted in UHub.</p>
      <p><strong>Title:</strong> ${request.title || 'N/A'}</p>
      <p><strong>Type:</strong> ${request.request_type || 'it_service'}</p>
      <p><strong>Status:</strong> ${request.status || 'open'}</p>
      <p><strong>Request ID:</strong> ${request.request_number || request.id || 'N/A'}</p>
      <p><strong>Submitted at:</strong> ${new Date(request.created_at || Date.now()).toLocaleString()}</p>
      <p>Please review this IT request in UHub.</p>
    `;
  }

  // Get users by role from UHub users table
  async getUsersByRole(role) {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, role, auth_user_id')
        .eq('role', role);

      if (usersError) throw usersError;

      const users = (usersData || []).map((user) => ({
        id: user.auth_user_id || user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }));

      const uniqueUsers = users.filter((user, index, self) =>
        index === self.findIndex(u => u.email === user.email)
      );

      console.log(`📋 Found ${uniqueUsers.length} users with role: ${role}`, uniqueUsers);
      return uniqueUsers;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }

  // Send notification to users by role using the real-time system
  async notifyUsersByRole(role, notification) {
    try {
      const users = await this.getUsersByRole(role);
      console.log(`📢 Notifying ${users.length} users with role: ${role}`);
      
      // Send notifications via Supabase real-time channels
      for (const user of users) {
        try {
          await supabase
            .channel(`user_${user.id}_notifications`)
            .send({
              type: 'broadcast',
              event: 'notification',
              payload: {
                id: Date.now() + Math.random(),
                type: notification.type,
                title: notification.title,
                message: notification.message,
                priority: notification.priority,
                data: notification.data,
                timestamp: new Date(),
                read: false
              }
            });
        } catch (channelError) {
          console.error(`Failed to send notification to user ${user.id}:`, channelError);
        }
      }
      
      return users.length;
    } catch (error) {
      console.error('Error notifying users by role:', error);
      return 0;
    }
  }

  // Complaint notifications
  async notifyComplaintCreated(complaint) {
    try {
      const notification = {
        type: 'complaint',
        title: 'New Complaint Submitted',
        message: `A new complaint has been submitted: ${complaint.title}`,
        priority: complaint.priority === 'urgent' ? 'urgent' : 
                 complaint.priority === 'high' ? 'high' : 'medium',
        data: {
          complaint_id: complaint.id,
          complaint_title: complaint.title,
          complaint_type: complaint.category,
          priority: complaint.priority,
          requester_id: complaint.complainant_id
        }
      };

      // Notify HR Managers
      const hrCount = await this.notifyUsersByRole('hr_manager', notification);
      
      // Notify Admins
      const adminCount = await this.notifyUsersByRole('admin', notification);

      const complaintEmails = this.getConfiguredEmails(
        'REACT_APP_COMPLAINT_ALERT_EMAILS',
        ['humera@udrive.ae', 'nagma@udrive.ae']
      );
      const complaintEmailResult = await this.sendEmailAlert(
        complaintEmails,
        `UHub Complaint Alert: ${complaint.title}`,
        this.buildComplaintEmailBody(complaint)
      );
      
      console.log(`✅ Complaint notifications sent: ${hrCount} HR Managers, ${adminCount} Admins, ${complaintEmailResult.sent} emails`);
      return hrCount + adminCount;
    } catch (error) {
      console.error('Error notifying complaint creation:', error);
      throw error;
    }
  }

  async notifyComplaintStatusUpdate(complaint, oldStatus, newStatus) {
    try {
      const notification = {
        type: 'complaint_update',
        title: 'Complaint Status Updated',
        message: `Complaint "${complaint.title}" status has been updated to ${newStatus}`,
        priority: 'medium',
        data: {
          complaint_id: complaint.id,
          complaint_title: complaint.title,
          old_status: oldStatus,
          new_status: newStatus
        }
      };

      // Notify HR Managers and Admins
      const hrCount = await this.notifyUsersByRole('hr_manager', notification);
      const adminCount = await this.notifyUsersByRole('admin', notification);
      
      console.log(`✅ Complaint status update notifications sent: ${hrCount} HR Managers, ${adminCount} Admins`);
      return hrCount + adminCount;
    } catch (error) {
      console.error('Error notifying complaint status update:', error);
      throw error;
    }
  }

  // IT Request notifications
  async notifyITRequestCreated(request) {
    try {
      const notification = {
        type: 'it_request',
        title: 'New IT Request Created',
        message: `A new IT request has been created: ${request.title}`,
        priority: 'high', // IT requests are generally high priority
        data: {
          request_id: request.id,
          request_title: request.title,
          request_type: request.request_type,
          priority: request.priority_id,
          requester_id: request.requester_id
        }
      };

      // Notify IT Managers
      const itCount = await this.notifyUsersByRole('it_management', notification);
      const itManagerCount = await this.notifyUsersByRole('it_manager', notification);
      const itRoleCount = await this.notifyUsersByRole('it', notification);
      
      // Notify Admins
      const adminCount = await this.notifyUsersByRole('admin', notification);

      const roleBasedEmails = [
        ...(await this.getUsersByRole('it_management')).map((user) => user.email),
        ...(await this.getUsersByRole('it_manager')).map((user) => user.email),
        ...(await this.getUsersByRole('it')).map((user) => user.email)
      ];
      const fixedItEmails = this.getConfiguredEmails(
        'REACT_APP_IT_ALERT_BASE_EMAILS',
        ['ifham@udrive.ae']
      );
      const itEmailRecipients = this.dedupeEmails([...fixedItEmails, ...roleBasedEmails]);
      const itEmailResult = await this.sendEmailAlert(
        itEmailRecipients,
        `UHub IT Request Alert: ${request.title}`,
        this.buildITRequestEmailBody(request)
      );
      
      console.log(`✅ IT Request notifications sent: ${itCount + itManagerCount + itRoleCount} IT users, ${adminCount} Admins, ${itEmailResult.sent} emails`);
      return itCount + itManagerCount + itRoleCount + adminCount;
    } catch (error) {
      console.error('Error notifying IT request creation:', error);
      throw error;
    }
  }

  async notifyITRequestStatusUpdate(request, oldStatus, newStatus) {
    try {
      const notification = {
        type: 'it_request_update',
        title: 'IT Request Status Updated',
        message: `IT Request "${request.title}" status has been updated to ${newStatus}`,
        priority: 'medium',
        data: {
          request_id: request.id,
          request_title: request.title,
          old_status: oldStatus,
          new_status: newStatus
        }
      };

      // Notify IT Managers and Admins
      const itCount = await this.notifyUsersByRole('it_management', notification);
      const itManagerCount = await this.notifyUsersByRole('it_manager', notification);
      const itRoleCount = await this.notifyUsersByRole('it', notification);
      const adminCount = await this.notifyUsersByRole('admin', notification);
      
      console.log(`✅ IT Request status update notifications sent: ${itCount + itManagerCount + itRoleCount} IT users, ${adminCount} Admins`);
      return itCount + itManagerCount + itRoleCount + adminCount;
    } catch (error) {
      console.error('Error notifying IT request status update:', error);
      throw error;
    }
  }

  // Suggestion notifications
  async notifySuggestionCreated(suggestion) {
    try {
      const notification = {
        type: 'suggestion',
        title: 'New Suggestion Submitted',
        message: `A new suggestion has been submitted: ${suggestion.title}`,
        priority: suggestion.priority === 'high' ? 'high' : 'medium',
        data: {
          suggestion_id: suggestion.id,
          suggestion_title: suggestion.title,
          suggestion_type: suggestion.suggestion_type,
          requester_id: suggestion.suggester_id
        }
      };

      const adminCount = await this.notifyUsersByRole('admin', notification);
      const suggestionEmails = this.getConfiguredEmails(
        'REACT_APP_SUGGESTION_ALERT_EMAILS',
        ['humera@udrive.ae', 'nagma@udrive.ae']
      );
      const suggestionEmailResult = await this.sendEmailAlert(
        suggestionEmails,
        `UHub Suggestion Alert: ${suggestion.title}`,
        this.buildSuggestionEmailBody(suggestion)
      );

      console.log(`✅ Suggestion notifications sent: ${adminCount} admins, ${suggestionEmailResult.sent} emails`);
      return adminCount;
    } catch (error) {
      console.error('Error notifying suggestion creation:', error);
      throw error;
    }
  }

  // Cleanup subscriptions
  cleanup() {
    this.subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

export default SimpleNotificationService;

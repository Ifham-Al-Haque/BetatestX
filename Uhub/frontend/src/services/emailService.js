// Email notification service for IT requests
import { supabase } from '../supabaseClient'; // Assuming supabaseClient is configured

export const emailService = {
  // Send basic email notification (tries Supabase Edge Function 'send-email' first, then logs)
  sendNotification: async (to, subject, body) => {
    if (!to || !subject) {
      console.warn('Email skipped: missing to or subject');
      return { success: false, message: 'Missing recipient or subject' };
    }
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body },
      });
      if (!error && data?.ok === true) {
        console.log('Email sent via Edge Function to:', to);
        return { success: true, message: 'Email sent.', recipients: data?.recipients };
      }
      if (error) {
        console.warn('Edge Function send-email not available or failed:', error.message, '- logging email locally');
      } else if (data?.ok === false) {
        console.warn('send-email reported failure:', data?.error || data);
      }
      console.log(`[Email would send] To: ${to} | Subject: ${subject}`);
      return {
        success: false,
        message: error?.message || data?.error || 'Email not sent (configure send-email Edge Function and SMTP secrets).',
      };
    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  },

  // Send request status update notification
  sendRequestStatusUpdate: async (request, recipientEmail, oldStatus, newStatus) => {
    const subject = `IT Request #${request.request_number} Status Update: ${newStatus.toUpperCase()}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
        <div style="background: #1f6feb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">IT Service Request Status Update</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2>Status Change Notification</h2>
          <p><strong>Request Number:</strong> ${request.request_number || `#${request.id}`}</p>
          <p><strong>Title:</strong> ${request.title}</p>
          <p><strong>Previous Status:</strong> ${oldStatus.replace('_', ' ').toUpperCase()}</p>
          <p><strong>New Status:</strong> <span style="color: #10b981; font-weight: bold;">${newStatus.replace('_', ' ').toUpperCase()}</span></p>
          <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
          ${request.resolution_notes ? `
            <p><strong>Resolution Notes:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
              ${request.resolution_notes}
            </div>
          ` : ''}
          <div style="text-align: center; margin: 20px 0;">
            <a href="${window.location.origin}/it-requests?view=${request.id}" style="background: #1f6feb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Request
            </a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 12px;">
          <p>This is an automated notification from the IT Service Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `;
    
    return emailService.sendNotification(recipientEmail, subject, body);
  },

  // Send request created notification
  sendRequestCreated: async (request, recipientEmail) => {
    const subject = `New IT Request Created: ${request.title}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1f6feb 0%, #a855f7 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">IT Service Request Created</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2>Request Details</h2>
          <p><strong>Request Number:</strong> ${request.request_number || `#${request.id}`}</p>
          <p><strong>Title:</strong> ${request.title}</p>
          <p><strong>Priority:</strong> ${request.priority?.name || 'Unknown'}</p>
          <p><strong>Category:</strong> ${request.category?.name || 'Unknown'}</p>
          <p><strong>Status:</strong> ${request.status}</p>
          <p><strong>Created:</strong> ${new Date(request.created_at).toLocaleString()}</p>
          <p><strong>Description:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${request.description}
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${window.location.origin}/it-requests?view=${request.id}" style="background: #1f6feb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Request
            </a>
          </div>
        </div>
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
          <p>This is an automated notification from the IT Service Management System.</p>
        </div>
      </div>
    `;
    
    return emailService.sendNotification(recipientEmail, subject, body);
  },

  // Send assignment notification
  sendAssignmentNotification: async (request, assigneeEmail, assignedBy) => {
    const subject = `IT Request Assigned: ${request.title}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1f6feb 0%, #a855f7 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Request Assigned</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2>Assignment Notification</h2>
          <p><strong>Request Number:</strong> ${request.request_number || `#${request.id}`}</p>
          <p><strong>Title:</strong> ${request.title}</p>
          <p><strong>Assigned To:</strong> ${request.assignee?.full_name || 'You'}</p>
          <p><strong>Priority:</strong> ${request.priority?.name || 'Unknown'}</p>
          <p><strong>Assigned By:</strong> ${assignedBy.full_name || assignedBy.email}</p>
          <p><strong>Assigned At:</strong> ${new Date().toLocaleString()}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${window.location.origin}/it-requests?view=${request.id}" style="background: #1f6feb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Request
            </a>
          </div>
        </div>
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
          <p>This is an automated notification from the IT Service Management System.</p>
        </div>
      </div>
    `;
    
    return emailService.sendNotification(assigneeEmail, subject, body);
  },

  // Send SLA warning notification
  sendSLAWarning: async (request, recipientEmail) => {
    const timeRemaining = emailService.calculateTimeRemaining(request);
    const subject = `SLA Warning: ${request.title}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SLA Warning</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2>⚠️ SLA Warning</h2>
          <p><strong>Request Number:</strong> ${request.request_number || `#${request.id}`}</p>
          <p><strong>Title:</strong> ${request.title}</p>
          <p><strong>Priority:</strong> ${request.priority?.name || 'Unknown'}</p>
          <p><strong>Time Remaining:</strong> <span style="color: #ef4444; font-weight: bold;">${timeRemaining}</span></p>
          <p><strong>Assigned To:</strong> ${request.assignee?.full_name || 'Unassigned'}</p>
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Action Required:</strong> Please prioritize this request to meet SLA requirements.</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${window.location.origin}/it-requests?view=${request.id}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Request
            </a>
          </div>
        </div>
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
          <p>This is an automated SLA warning from the IT Service Management System.</p>
        </div>
      </div>
    `;
    
    return emailService.sendNotification(recipientEmail, subject, body);
  },

  // Calculate time remaining for SLA
  calculateTimeRemaining: (request) => {
    if (!request.priority || !request.created_at) return 'Unknown';
    
    const created = new Date(request.created_at);
    const now = new Date();
    const hoursElapsed = (now - created) / (1000 * 60 * 60);
    const slaHours = request.priority.sla_hours || 72;
    const remaining = slaHours - hoursElapsed;
    
    if (remaining <= 0) {
      return 'Overdue';
    } else if (remaining <= 1) {
      return `${Math.round(remaining * 60)} minutes`;
    } else {
      return `${Math.round(remaining)} hours`;
    }
  },

  // Get status color for email
  getStatusColor: (status) => {
    const colors = {
      'open': '#1f6feb',
      'assigned': '#3b82f6',
      'in_progress': '#f59e0b',
      'pending_user': '#8b5cf6',
      'resolved': '#10b981',
      'closed': '#6b7280',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  },

  /**
   * Send email when a task is assigned to a user (Uhub Task Management).
   * @param {object} task - { id, title, description?, priority, due_date, department }
   * @param {string} assigneeEmail - Email of the assigned user
   * @param {string} assignedByName - Full name (or email) of the assigner
   */
  sendTaskAssignedNotification: async (task, assigneeEmail, assignedByName) => {
    if (!assigneeEmail || !task?.title) {
      return { success: false, message: 'Missing assignee email or task title.' };
    }
    const taskUrl = `${window.location.origin}/task-management${task.id ? `?task=${task.id}` : ''}`;
    const subject = `Uhub: New task assigned to you – ${task.title}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">New Task Assigned</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95;">Uhub – Unified Platform</p>
        </div>
        <div style="padding: 24px; background: #f8fafc;">
          <p style="margin: 0 0 16px 0; color: #374151;">You have been assigned a new task.</p>
          <p style="margin: 0 0 8px 0;"><strong>Task:</strong> ${task.title || 'Untitled'}</p>
          ${task.description ? `<p style="margin: 0 0 8px 0;"><strong>Description:</strong></p><div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px;">${task.description}</div>` : ''}
          <p style="margin: 0 0 4px 0;"><strong>Assigned by:</strong> ${assignedByName || 'A colleague'}</p>
          ${task.due_date ? `<p style="margin: 0 0 4px 0;"><strong>Due date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
          ${task.priority ? `<p style="margin: 0 0 16px 0;"><strong>Priority:</strong> ${task.priority}</p>` : ''}
          <div style="text-align: center; margin: 20px 0;">
            <a href="${taskUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View task in Uhub</a>
          </div>
        </div>
        <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
          This is an automated notification from Uhub. Please do not reply to this email.
        </div>
      </div>
    `;
    return emailService.sendNotification(assigneeEmail, subject, body);
  },

  /**
   * Send email when a user logs in to Uhub (security / awareness).
   * @param {string} userEmail - Email of the user who logged in
   * @param {Date} [timestamp] - Login time
   */
  sendLoginNotification: async (userEmail, timestamp = new Date()) => {
    if (!userEmail) return { success: false, message: 'Missing user email.' };
    const subject = `Uhub: You logged in successfully`;
    const timeStr = timestamp instanceof Date ? timestamp.toLocaleString() : new Date(timestamp).toLocaleString();
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Login to Uhub</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95;">Unified Platform</p>
        </div>
        <div style="padding: 24px; background: #f8fafc;">
          <p style="margin: 0 0 8px 0; color: #374151;">You successfully logged in to your Uhub account.</p>
          <p style="margin: 0 0 8px 0;"><strong>Account:</strong> ${userEmail}</p>
          <p style="margin: 0 0 16px 0;"><strong>Time:</strong> ${timeStr}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">If this wasn’t you, please change your password and contact your administrator.</p>
        </div>
        <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
          This is an automated notification from Uhub.
        </div>
      </div>
    `;
    return emailService.sendNotification(userEmail, subject, body);
  },

  /**
   * Email every active UHub user in the given roles.
   * Recipients are resolved in the send-email Edge Function (service role),
   * so employee submitters can still reach HR/IT when RLS hides those users.
   */
  sendToRoles: async (roles, subject, body) => {
    const uniqueRoles = [...new Set((roles || []).filter(Boolean))];
    if (!uniqueRoles.length || !subject) {
      return { success: false, message: 'Missing roles or subject' };
    }
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { roles: uniqueRoles, subject, body },
      });
      if (!error && data?.ok === true) {
        return { success: true, message: 'Email sent.', recipients: data?.recipients };
      }
      return {
        success: false,
        message: error?.message || data?.error || 'Email not sent (configure send-email Edge Function).',
      };
    } catch (error) {
      console.error('Error sending role email notification:', error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  },
};

/**
 * PRODUCTION EMAIL: To send real emails, use a Supabase Edge Function (or your backend).
 * 1. Create an Edge Function that accepts { to, subject, body } and calls your email provider (Resend, SendGrid, SES).
 * 2. In sendNotification(), uncomment and use:
 *    const { data, error } = await supabase.functions.invoke('send-email', { body: { to, subject, body } });
 * 3. Ensure the function has the provider API key in secrets. Do not put API keys in the client.
 */
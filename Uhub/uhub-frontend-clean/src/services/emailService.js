// Email notification service for IT requests
import { supabase } from '../supabaseClient'; // Assuming supabaseClient is configured

export const emailService = {
  // Send basic email notification
  sendNotification: async (to, subject, body) => {
    try {
      // In a real application, this would call a serverless function or an external email API
      // For demonstration, we'll log it and simulate success.
      console.log(`Simulating email to: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);

      // Example of how you might integrate with a backend function (e.g., Supabase Edge Function)
      // const { data, error } = await supabase.functions.invoke('send-email', {
      //   body: { to, subject, body },
      // });

      // if (error) throw error;

      return { success: true, message: 'Email notification simulated successfully.' };
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
  }
};
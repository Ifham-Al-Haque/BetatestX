import { supabase } from '../supabaseClient';

class SimpleNotificationService {
  constructor() {
    this.subscriptions = new Map();
  }

  // Get users by role from multiple tables (users and employees)
  async getUsersByRole(role) {
    try {
      let users = [];
      
      // First, try to get from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, role, auth_user_id')
        .eq('role', role);

      if (!usersError && usersData) {
        users = usersData.map(user => ({
          id: user.auth_user_id || user.id, // Use auth_user_id if available
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }));
      }

      // Also try to get from employees table
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, email, role, auth_user_id')
        .eq('role', role);

      if (!employeesError && employeesData) {
        const employeeUsers = employeesData.map(emp => ({
          id: emp.auth_user_id || emp.id, // Use auth_user_id if available
          full_name: emp.full_name,
          email: emp.email,
          role: emp.role
        }));
        users = [...users, ...employeeUsers];
      }

      // Remove duplicates based on email
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
      
      console.log(`✅ Complaint notifications sent: ${hrCount} HR Managers, ${adminCount} Admins`);
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
      
      // Notify Admins
      const adminCount = await this.notifyUsersByRole('admin', notification);
      
      console.log(`✅ IT Request notifications sent: ${itCount} IT Managers, ${adminCount} Admins`);
      return itCount + adminCount;
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
      const adminCount = await this.notifyUsersByRole('admin', notification);
      
      console.log(`✅ IT Request status update notifications sent: ${itCount} IT Managers, ${adminCount} Admins`);
      return itCount + adminCount;
    } catch (error) {
      console.error('Error notifying IT request status update:', error);
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

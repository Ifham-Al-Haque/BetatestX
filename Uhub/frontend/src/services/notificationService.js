import { supabase } from '../supabaseClient';
import { useNotifications } from '../context/NotificationContext';

class NotificationService {
  constructor() {
    this.subscriptions = [];
  }

  // Setup calendar event notifications
  async setupCalendarNotifications(addNotification) {
    try {
      const calendarSub = supabase
        .channel('calendar_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        }, (payload) => {
          addNotification({
            type: 'calendar',
            title: 'New Calendar Event',
            message: `A new event "${payload.new.title}" has been scheduled for ${new Date(payload.new.start_date).toLocaleDateString()}`,
            priority: payload.new.priority || 'medium',
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'events'
        }, (payload) => {
          addNotification({
            type: 'calendar',
            title: 'Calendar Event Updated',
            message: `Event "${payload.new.title}" has been updated`,
            priority: payload.new.priority || 'medium',
            data: payload.new
          });
        })
        .subscribe();

      this.subscriptions.push(calendarSub);
      return calendarSub;
    } catch (error) {
      console.error('Error setting up calendar notifications:', error);
      return null;
    }
  }

  // Setup payment status notifications
  async setupPaymentNotifications(addNotification) {
    try {
      const paymentSub = supabase
        .channel('payment_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'payments'
        }, (payload) => {
          addNotification({
            type: 'payment',
            title: 'New Payment Due',
            message: `Payment "${payload.new.title}" of ${payload.new.amount} is due on ${new Date(payload.new.due_date).toLocaleDateString()}`,
            priority: payload.new.priority || 'medium',
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments'
        }, (payload) => {
          if (payload.new.status !== payload.old.status) {
            addNotification({
              type: 'payment',
              title: 'Payment Status Updated',
              message: `Payment "${payload.new.title}" status changed to ${payload.new.status}`,
              priority: payload.new.priority || 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();

      this.subscriptions.push(paymentSub);
      return paymentSub;
    } catch (error) {
      console.error('Error setting up payment notifications:', error);
      return null;
    }
  }

  // Setup attendance notifications
  async setupAttendanceNotifications(addNotification) {
    try {
      const attendanceSub = supabase
        .channel('attendance_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance'
        }, (payload) => {
          addNotification({
            type: 'attendance',
            title: 'New Attendance Record',
            message: `Attendance record created for ${payload.new.employee_name || 'Employee'}`,
            priority: 'low',
            data: payload.new
          });
        })
        .subscribe();

      this.subscriptions.push(attendanceSub);
      return attendanceSub;
    } catch (error) {
      console.error('Error setting up attendance notifications:', error);
      return null;
    }
  }

  // Setup task notifications
  async setupTaskNotifications(addNotification) {
    try {
      const taskSub = supabase
        .channel('task_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks'
        }, (payload) => {
          addNotification({
            type: 'task',
            title: 'New Task Assigned',
            message: `Task "${payload.new.title}" has been assigned to you`,
            priority: payload.new.priority || 'medium',
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks'
        }, (payload) => {
          if (payload.new.status !== payload.old.status) {
            addNotification({
              type: 'task',
              title: 'Task Status Updated',
              message: `Task "${payload.new.title}" status changed to ${payload.new.status}`,
              priority: payload.new.priority || 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();

      this.subscriptions.push(taskSub);
      return taskSub;
    } catch (error) {
      console.error('Error setting up task notifications:', error);
      return null;
    }
  }

  // Setup expense notifications
  async setupExpenseNotifications(addNotification) {
    try {
      const expenseSub = supabase
        .channel('expense_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses'
        }, (payload) => {
          addNotification({
            type: 'expense',
            title: 'New Expense Submitted',
            message: `Expense "${payload.new.description}" of ${payload.new.amount} has been submitted`,
            priority: payload.new.priority || 'medium',
            data: payload.new
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'expenses'
        }, (payload) => {
          if (payload.new.status !== payload.old.status) {
            addNotification({
              type: 'expense',
              title: 'Expense Status Updated',
              message: `Expense "${payload.new.description}" status changed to ${payload.new.status}`,
              priority: payload.new.priority || 'medium',
              data: payload.new
            });
          }
        })
        .subscribe();

      this.subscriptions.push(expenseSub);
      return expenseSub;
    } catch (error) {
      console.error('Error setting up expense notifications:', error);
      return null;
    }
  }

  // Setup all notification types
  async setupAllNotifications(addNotification) {
    await Promise.all([
      this.setupCalendarNotifications(addNotification),
      this.setupPaymentNotifications(addNotification),
      this.setupAttendanceNotifications(addNotification),
      this.setupTaskNotifications(addNotification),
      this.setupExpenseNotifications(addNotification)
    ]);
  }

  // Cleanup all subscriptions
  cleanup() {
    this.subscriptions.forEach(sub => {
      if (sub) {
        supabase.removeChannel(sub);
      }
    });
    this.subscriptions = [];
  }

  // Send test notification
  sendTestNotification(addNotification, type = 'info') {
    addNotification({
      type,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      priority: 'medium',
      data: { test: true }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

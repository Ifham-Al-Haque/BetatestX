import { supabase } from '../supabaseClient';

class CollectionService {
  
  // =====================================================
  // COLLECTION PAYMENTS
  // =====================================================
  
  async getAllPayments(filters = {}) {
    try {
      let query = supabase
        .from('collection_payments')
        .select('*')
        .order('payment_due_date', { ascending: true });
      
      // Apply filters
      if (filters.status) {
        query = query.eq('payment_status', filters.status);
      }
      if (filters.collectionStatus) {
        query = query.eq('collection_status', filters.collectionStatus);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_collector_id', filters.assignedTo);
      }
      if (filters.priority) {
        query = query.eq('collection_priority', filters.priority);
      }
      if (filters.fromDate) {
        query = query.gte('payment_due_date', filters.fromDate);
      }
      if (filters.toDate) {
        query = query.lte('payment_due_date', filters.toDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }
  
  async getPaymentById(id) {
    try {
      const { data, error } = await supabase
        .from('collection_payments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }
  
  async createPayment(paymentData) {
    try {
      const { data, error } = await supabase
        .from('collection_payments')
        .insert([paymentData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }
  
  async updatePayment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('collection_payments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }
  
  async deletePayment(id) {
    try {
      const { error } = await supabase
        .from('collection_payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
  
  async recordPayment(paymentId, amountPaid, paymentMethod, notes) {
    try {
      // Get current payment
      const payment = await this.getPaymentById(paymentId);
      
      // Update payment with new amount
      const newAmountPaid = (payment.amount_paid || 0) + amountPaid;
      
      const { data, error } = await supabase
        .from('collection_payments')
        .update({
          amount_paid: newAmountPaid,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await this.logActivity({
        payment_id: paymentId,
        activity_type: 'payment_received',
        activity_title: 'Payment Received',
        activity_description: `Payment of AED ${amountPaid} received via ${paymentMethod}`,
        outcome: newAmountPaid >= payment.payment_amount ? 'successful' : 'partial_payment',
        amount_collected: amountPaid,
        payment_method: paymentMethod
      });
      
      return data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }
  
  async getOverduePayments() {
    try {
      const { data, error } = await supabase
        .from('collection_payments')
        .select('*')
        .eq('payment_status', 'overdue')
        .gt('balance_remaining', 0)
        .order('payment_due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
      throw error;
    }
  }
  
  async getPaymentStats() {
    try {
      const { data, error } = await supabase
        .from('collection_payments')
        .select('payment_status, payment_amount, balance_remaining, amount_paid');
      
      if (error) throw error;
      
      // Calculate stats
      const stats = {
        totalPayments: data.length,
        totalAmount: data.reduce((sum, p) => sum + parseFloat(p.payment_amount || 0), 0),
        totalCollected: data.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0),
        totalOutstanding: data.reduce((sum, p) => sum + parseFloat(p.balance_remaining || 0), 0),
        pendingCount: data.filter(p => p.payment_status === 'pending').length,
        overdueCount: data.filter(p => p.payment_status === 'overdue').length,
        paidCount: data.filter(p => p.payment_status === 'paid').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }
  
  // =====================================================
  // COLLECTION REMINDERS
  // =====================================================
  
  async getAllReminders(filters = {}) {
    try {
      let query = supabase
        .from('collection_reminders')
        .select('*')
        .order('reminder_date', { ascending: true });
      
      // Apply filters
      if (filters.status) {
        query = query.eq('reminder_status', filters.status);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.type) {
        query = query.eq('reminder_type', filters.type);
      }
      if (filters.fromDate) {
        query = query.gte('reminder_date', filters.fromDate);
      }
      if (filters.toDate) {
        query = query.lte('reminder_date', filters.toDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }
  
  async getTodaysReminders() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('collection_reminders')
        .select('*')
        .eq('reminder_date', today)
        .eq('reminder_status', 'pending')
        .order('reminder_time', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching today\'s reminders:', error);
      throw error;
    }
  }
  
  async getUpcomingReminders(days = 7) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('collection_reminders')
        .select('*')
        .gte('reminder_date', today)
        .lte('reminder_date', futureDateStr)
        .eq('reminder_status', 'pending')
        .order('reminder_date', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      throw error;
    }
  }
  
  async createReminder(reminderData) {
    try {
      const { data, error } = await supabase
        .from('collection_reminders')
        .insert([reminderData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }
  
  async updateReminder(id, updates) {
    try {
      const { data, error } = await supabase
        .from('collection_reminders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }
  
  async acknowledgeReminder(id, actionTaken) {
    try {
      const { data, error } = await supabase
        .from('collection_reminders')
        .update({
          reminder_status: 'acknowledged',
          action_taken: actionTaken,
          action_date: new Date().toISOString(),
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error acknowledging reminder:', error);
      throw error;
    }
  }
  
  async snoozeReminder(id, snoozeUntil) {
    try {
      const { data, error } = await supabase
        .from('collection_reminders')
        .update({
          reminder_status: 'snoozed',
          snoozed_until: snoozeUntil,
          snooze_count: supabase.raw('snooze_count + 1')
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      throw error;
    }
  }
  
  async deleteReminder(id) {
    try {
      const { error } = await supabase
        .from('collection_reminders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
  
  // =====================================================
  // COLLECTION CHECKLIST
  // =====================================================
  
  async getAllChecklistItems(filters = {}) {
    try {
      let query = supabase
        .from('collection_checklist')
        .select('*')
        .order('due_date', { ascending: true });
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('checklist_category', filters.category);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      throw error;
    }
  }
  
  async getTodaysChecklist() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('collection_checklist')
        .select('*')
        .eq('due_date', today)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching today\'s checklist:', error);
      throw error;
    }
  }
  
  async createChecklistItem(checklistData) {
    try {
      const { data, error } = await supabase
        .from('collection_checklist')
        .insert([checklistData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating checklist item:', error);
      throw error;
    }
  }
  
  async updateChecklistItem(id, updates) {
    try {
      const { data, error } = await supabase
        .from('collection_checklist')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      throw error;
    }
  }
  
  async completeChecklistItem(id, completionNotes) {
    try {
      const { data, error } = await supabase
        .from('collection_checklist')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: completionNotes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing checklist item:', error);
      throw error;
    }
  }
  
  async deleteChecklistItem(id) {
    try {
      const { error } = await supabase
        .from('collection_checklist')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      throw error;
    }
  }
  
  async getChecklistStats() {
    try {
      const { data, error } = await supabase
        .from('collection_checklist')
        .select('status, priority');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        pending: data.filter(item => item.status === 'pending').length,
        inProgress: data.filter(item => item.status === 'in_progress').length,
        completed: data.filter(item => item.status === 'completed').length,
        urgent: data.filter(item => item.priority === 'Urgent').length,
        high: data.filter(item => item.priority === 'High').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching checklist stats:', error);
      throw error;
    }
  }
  
  // =====================================================
  // ACTIVITY LOG
  // =====================================================
  
  async logActivity(activityData) {
    try {
      const { data, error } = await supabase
        .from('collection_activity_log')
        .insert([activityData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }
  
  async getActivityLog(filters = {}) {
    try {
      let query = supabase
        .from('collection_activity_log')
        .select('*')
        .order('activity_date', { ascending: false })
        .limit(100);
      
      if (filters.paymentId) {
        query = query.eq('payment_id', filters.paymentId);
      }
      if (filters.activityType) {
        query = query.eq('activity_type', filters.activityType);
      }
      if (filters.performedBy) {
        query = query.eq('performed_by', filters.performedBy);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  }
  
  // =====================================================
  // DEPARTMENT SETTINGS
  // =====================================================
  
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('collection_department_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }
  
  async updateSettings(settingsData) {
    try {
      const { data, error } = await supabase
        .from('collection_department_settings')
        .update({ ...settingsData, updated_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
  
  // =====================================================
  // REALTIME SUBSCRIPTIONS
  // =====================================================
  
  subscribeToReminders(callback) {
    const subscription = supabase
      .channel('collection_reminders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'collection_reminders' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  }
  
  subscribeToPayments(callback) {
    const subscription = supabase
      .channel('collection_payments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'collection_payments' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  }
  
  subscribeToChecklist(callback) {
    const subscription = supabase
      .channel('collection_checklist_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'collection_checklist' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    return subscription;
  }
}

const collectionService = new CollectionService();
export default collectionService;


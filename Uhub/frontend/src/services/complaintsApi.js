import { supabase } from '../supabaseClient';

export const complaintsApi = {
  // Create a new complaint
  async createComplaint(complaintData) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert({
          title: complaintData.title,
          description: complaintData.description,
          category: complaintData.category,
          priority: complaintData.priority,
          status: 'open',
          anonymous: complaintData.anonymous,
          complainant_id: complaintData.complainant_id,
          complainant_name: complaintData.complainant_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  },

  // Get all complaints (with role-based filtering)
  async getComplaints(userId, userRole) {
    try {
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'employee') {
        // Employees can only see their own complaints
        query = query.eq('complainant_id', userId);
      }
      // Admins, HR, and managers can see all complaints

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  },

  // Get complaint by ID
  async getComplaintById(complaintId) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaintId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw error;
    }
  },

  // Update complaint
  async updateComplaint(complaintId, updateData) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  },

  // Update complaint status
  async updateComplaintStatus(complaintId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw error;
    }
  },

  // Delete complaint
  async deleteComplaint(complaintId) {
    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  },

  // Get all complaints for HR managers and admins (no filtering)
  async getAllComplaintsForHR() {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all complaints for HR:', error);
      throw error;
    }
  },

  // Get complaints with filters
  async getComplaintsWithFilters(filters, userId, userRole) {
    try {
      console.log('getComplaintsWithFilters called with:', { filters, userId, userRole });
      
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'employee') {
        console.log('Applying employee filter for user:', userId);
        query = query.eq('complainant_id', userId);
      } else {
        console.log('No role filtering applied for role:', userRole);
      }
      // HR managers, admins, and managers can see all complaints

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply priority filter
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      console.log('Final query:', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Query result:', { data, error });
      return data || [];
    } catch (error) {
      console.error('Error fetching filtered complaints:', error);
      throw error;
    }
  },

  // Get complaint statistics
  async getComplaintStats(userId, userRole) {
    try {
      let query = supabase
        .from('complaints')
        .select('*');

      // Apply role-based filtering
      if (userRole === 'employee') {
        query = query.eq('complainant_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const complaints = data || [];
      
      return {
        total_complaints: complaints.length,
        open_complaints: complaints.filter(c => c.status === 'open').length,
        in_progress_complaints: complaints.filter(c => c.status === 'in_progress').length,
        resolved_complaints: complaints.filter(c => c.status === 'resolved').length,
        closed_complaints: complaints.filter(c => c.status === 'closed').length,
        urgent_complaints: complaints.filter(c => c.priority === 'urgent').length,
        high_complaints: complaints.filter(c => c.priority === 'high').length,
        medium_complaints: complaints.filter(c => c.priority === 'medium').length,
        low_complaints: complaints.filter(c => c.priority === 'low').length
      };
    } catch (error) {
      console.error('Error fetching complaint statistics:', error);
      throw error;
    }
  }
};

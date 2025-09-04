import { supabase } from '../supabaseClient';

export const complaintsApi = {
  // Test database connection and table existence
  async testDatabaseConnection() {
    try {
      console.log('Testing database connection...');
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('complaints')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        return { success: false, error: testError };
      }
      
      console.log('Database connection test successful');
      return { success: true, data: testData };
    } catch (error) {
      console.error('Database connection test error:', error);
      return { success: false, error };
    }
  },

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
      if (userRole === 'admin') {
        // Admins can see all complaints - no filtering needed
      } else {
        // All other roles (including HR managers, CS managers, etc.) can only see their own complaints
        query = query.eq('complainant_id', userId);
      }

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

  // Get all complaints for admins only (no filtering)
  async getAllComplaintsForAdmin() {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all complaints for admin:', error);
      throw error;
    }
  },

  // Get all complaints with filters for admins only (excluding their own complaints)
  async getAllComplaintsWithFiltersForAdmin(filters, currentUserId = null) {
    try {
      console.log('getAllComplaintsWithFiltersForAdmin called with filters:', filters, 'currentUserId:', currentUserId);
      
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      // Exclude complaints raised by the current admin
      if (currentUserId) {
        query = query.neq('complainant_id', currentUserId);
        console.log('Excluding complaints from current admin user:', currentUserId);
      }

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

      // Apply department filter
      if (filters.department) {
        query = query.eq('assigned_department', filters.department);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      console.log('Final admin query (excluding current user complaints):', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Admin Query result (excluding current user complaints):', { data, error });
      return data || [];
    } catch (error) {
      console.error('Error fetching filtered complaints for admin:', error);
      throw error;
    }
  },

  // Get complaints raised by the current user (for personal view)
  async getCurrentUserComplaints(userId, filters = {}) {
    try {
      console.log('getCurrentUserComplaints called for user:', userId, 'with filters:', filters);
      
      let query = supabase
        .from('complaints')
        .select('*')
        .eq('complainant_id', userId)
        .order('created_at', { ascending: false });

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

      console.log('Final current user complaints query:', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Current user complaints query result:', { data, error });
      return data || [];
    } catch (error) {
      console.error('Error fetching current user complaints:', error);
      throw error;
    }
  },

  // Get ALL complaints including current user's (for admin purposes)
  async getAllComplaintsIncludingCurrentUser(filters) {
    try {
      console.log('getAllComplaintsIncludingCurrentUser called with filters:', filters);
      
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

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

      // Apply department filter
      if (filters.department) {
        query = query.eq('assigned_department', filters.department);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      console.log('Final admin query (including all complaints):', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Admin query result (including all complaints):', { data, error });
      return data || [];
    } catch (error) {
      console.error('Error fetching all complaints for admin:', error);
      throw error;
    }
  },

  // Get complaints by specific categories (for concerns view) - HR Manager and Admin access
  async getComplaintsByCategories(filters, categories) {
    try {
      console.log('getComplaintsByCategories called with filters:', filters, 'categories:', categories);
      
      let query = supabase
        .from('complaints')
        .select('*')
        .in('category', categories)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply priority filter
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Apply department filter
      if (filters.department) {
        query = query.eq('assigned_department', filters.department);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      console.log('Final concerns query:', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Concerns query result:', { data, error });
      return data || [];
    } catch (error) {
      console.error('Error fetching complaints by categories:', error);
      throw error;
    }
  },

  // Get ALL complaints for HR Manager and Admin inbox access (bypasses role restrictions)
  async getAllComplaintsForInbox(filters = {}) {
    try {
      console.log('getAllComplaintsForInbox called with filters:', filters);
      
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

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

      // Apply department filter
      if (filters.department) {
        query = query.eq('assigned_department', filters.department);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      console.log('Final inbox query (all complaints):', query);
      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Inbox query result (all complaints):', { data, error });
      return data || [];
    } catch (error) {
      console.error('Error fetching all complaints for inbox:', error);
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
      if (userRole === 'admin') {
        console.log('Admin role - can see all complaints');
        // Admins can see all complaints - no filtering needed
      } else {
        console.log('Non-admin role - restricting to own complaints for user:', userId);
        // All other roles (including HR managers, CS managers, etc.) can only see their own complaints
        query = query.eq('complainant_id', userId);
      }

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
      if (userRole === 'admin') {
        // Admins can see all complaints - no filtering needed
      } else {
        // All other roles (including HR managers, CS managers, etc.) can only see their own complaints
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
  },

  // Update complaint priority
  async updateComplaintPriority(complaintId, newPriority) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          priority: newPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating complaint priority:', error);
      throw error;
    }
  },

  // Assign complaint to department
  async assignComplaintToDepartment(complaintId, department) {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .update({
          assigned_department: department,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning complaint to department:', error);
      throw error;
    }
  }
};

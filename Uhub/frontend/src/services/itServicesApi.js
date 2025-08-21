import { supabase } from '../supabaseClient';

// IT Services API Service
export const itServicesApi = {
  // IT Request Categories
  categories: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('it_request_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, name');
      
      if (error) throw error;
      return data;
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('it_request_categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // IT Request Priorities
  priorities: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('it_request_priorities')
        .select('*')
        .order('level');
      
      if (error) throw error;
      return data;
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('it_request_priorities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // IT Requests
  requests: {
    // Get all requests with role-based filtering
    getAll: async (filters = {}, userId = null, userRole = null) => {
      let query = supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon, description),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'employee' || (!userRole && userId)) {
        // Regular users can only see their own requests
        query = query.eq('requester_id', userId);
      }
      // Tech roles and admins can see all requests (no additional filtering needed)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.priority_id) {
        query = query.eq('priority_id', filters.priority_id);
      }
      if (filters.requester_id) {
        query = query.eq('requester_id', filters.requester_id);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.request_type) {
        query = query.eq('request_type', filters.request_type);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },

    // Get all requests for tech roles and admins (no filtering)
    getAllForTech: async () => {
      const { data, error } = await supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon, description),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    // Get requests with advanced filtering for tech roles
    getWithFilters: async (filters = {}) => {
      let query = supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon, description),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply priority filter
      if (filters.priority) {
        query = query.eq('priority_id', filters.priority);
      }

      // Apply category filter
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      // Apply assignee filter
      if (filters.assignee) {
        query = query.eq('assigned_to', filters.assignee);
      }

      // Apply date range filter
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon, description),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    create: async (requestData) => {
      const { data, error } = await supabase
        .from('it_requests')
        .insert({
          title: requestData.title,
          description: requestData.description,
          request_type: requestData.request_type || 'it_service',
          category_id: requestData.category_id,
          priority_id: requestData.priority_id,
          requester_id: requestData.requester_id,
          estimated_completion_date: requestData.estimated_completion_date,
          status: 'open'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id, updateData) => {
      const { data, error } = await supabase
        .from('it_requests')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Update request status
    updateStatus: async (id, status, notes = null, assignedTo = null) => {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.resolution_notes = notes;
      }

      if (assignedTo) {
        updateData.assigned_to = assignedTo;
        updateData.assigned_at = new Date().toISOString();
      }

      if (status === 'resolved' || status === 'closed') {
        updateData.actual_completion_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('it_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Assign request to tech support
    assignRequest: async (id, assignedTo) => {
      const { data, error } = await supabase
        .from('it_requests')
        .update({
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    // Close request
    closeRequest: async (id, closedBy, notes = null) => {
      const { data, error } = await supabase
        .from('it_requests')
        .update({
          status: 'closed',
          closed_by: closedBy,
          closed_at: new Date().toISOString(),
          resolution_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('it_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Get request statistics
    getStats: async (userId = null, userRole = null) => {
      let query = supabase
        .from('it_requests')
        .select('*');

      // Apply role-based filtering for statistics
      if (userRole === 'employee' && userId) {
        query = query.eq('requester_id', userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const requests = data || [];
      
      return {
        total_requests: requests.length,
        open_requests: requests.filter(r => r.status === 'open').length,
        in_progress_requests: requests.filter(r => r.status === 'in_progress').length,
        pending_user_requests: requests.filter(r => r.status === 'pending_user').length,
        resolved_requests: requests.filter(r => r.status === 'resolved').length,
        closed_requests: requests.filter(r => r.status === 'closed').length,
        cancelled_requests: requests.filter(r => r.status === 'cancelled').length,
        high_priority_requests: requests.filter(r => {
          // Assuming priority levels 1-2 are high priority
          return r.priority && r.priority.level <= 2;
        }).length,
        assigned_requests: requests.filter(r => r.assigned_to).length,
        unassigned_requests: requests.filter(r => !r.assigned_to).length
      };
    },

    // Get requests by status for dashboard
    getByStatus: async (status, userId = null, userRole = null) => {
      let query = supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon),
          priority:it_request_priorities(name, level, color),
          requester:requester_id(full_name, email)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'employee' && userId) {
        query = query.eq('requester_id', userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  },

  // IT Assets (if needed)
  assets: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('it_assets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  }
};

export default itServicesApi;

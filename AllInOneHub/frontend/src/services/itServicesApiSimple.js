import { supabase } from '../supabaseClient';

// Simplified IT Services API that works without views
export const itServicesApiSimple = {
  // IT Request Categories
  categories: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('it_request_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    }
  },

  // IT Request Priorities
  priorities: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('it_request_priorities')
          .select('*')
          .order('level', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching priorities:', error);
        return [];
      }
    }
  },

  // IT Requests - Direct table access
  requests: {
    getAll: async (filters = {}, userId = null, userRole = null) => {
      try {
        let query = supabase
          .from('it_requests')
          .select(`
            *,
            requester:requester_id(full_name, email, avatar_url),
            assigned:assigned_to(full_name, email, avatar_url),
            category:category_id(name, description, icon, color),
            priority:priority_id(name, level, color, sla_hours, description)
          `)
          .order('created_at', { ascending: false });

        // Apply role-based filtering
        if (userRole === 'employee' || (!userRole && userId)) {
          query = query.eq('requester_id', userId);
        }

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
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,request_number.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data: data || [] };
      } catch (error) {
        console.error('Error fetching requests:', error);
        return { data: [] };
      }
    },

    create: async (requestData) => {
      try {
        const { data, error } = await supabase
          .from('it_requests')
          .insert({
            title: requestData.title,
            description: requestData.description,
            request_type: requestData.request_type || 'it_service',
            category_id: requestData.category_id,
            priority_id: requestData.priority_id,
            requester_id: requestData.requester_id,
            estimated_completion_date: requestData.estimated_completion_date || null,
            status: 'open'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating request:', error);
        throw error;
      }
    },

    update: async (id, updateData) => {
      try {
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
      } catch (error) {
        console.error('Error updating request:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_requests')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting request:', error);
        throw error;
      }
    },

    // Simple stats calculation
    getStats: async (userId = null, userRole = null) => {
      try {
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
          assigned_requests: requests.filter(r => r.status === 'assigned').length,
          in_progress_requests: requests.filter(r => r.status === 'in_progress').length,
          pending_user_requests: requests.filter(r => r.status === 'pending_approval').length,
          resolved_requests: requests.filter(r => r.status === 'resolved').length,
          closed_requests: requests.filter(r => r.status === 'closed').length,
          cancelled_requests: requests.filter(r => r.status === 'cancelled').length,
          my_requests: requests.filter(r => r.requester_id === userId).length,
          assigned_to_me: requests.filter(r => r.assigned_to === userId).length
        };
      } catch (error) {
        console.error('Error fetching request stats:', error);
        return {
          total_requests: 0,
          open_requests: 0,
          assigned_requests: 0,
          in_progress_requests: 0,
          pending_user_requests: 0,
          resolved_requests: 0,
          closed_requests: 0,
          cancelled_requests: 0,
          my_requests: 0,
          assigned_to_me: 0
        };
      }
    }
  }
};

export default itServicesApiSimple;

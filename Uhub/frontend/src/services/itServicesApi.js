import { supabase } from '../supabaseClient';

// IT Services API Service
export const itServicesApi = {
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
        return data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('it_request_categories')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching category:', error);
        throw error;
      }
    },

    create: async (categoryData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_categories')
          .insert(categoryData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating category:', error);
        throw error;
      }
    },

    update: async (id, categoryData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_categories')
          .update(categoryData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_request_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
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
        return data;
      } catch (error) {
        console.error('Error fetching priorities:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('it_request_priorities')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching priority:', error);
        throw error;
      }
    },

    create: async (priorityData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_priorities')
          .insert(priorityData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating priority:', error);
        throw error;
      }
    },

    update: async (id, priorityData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_priorities')
          .update(priorityData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating priority:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_request_priorities')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting priority:', error);
        throw error;
      }
    }
  },

  // IT Requests
  requests: {
    // Get all requests with role-based filtering
    getAll: async (filters = {}, userId = null, userRole = null) => {
      try {
        // Try to use the view first, fallback to base table if view doesn't exist
        let query = supabase
          .from('it_request_details')
          .select('*')
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        
        // If view doesn't exist (404, PGRST116, or 42P01), fallback to base table
        if (error && (error.code === 'PGRST116' || error.status === 404 || error.code === '42P01')) {
          console.warn('it_request_details view not found, using fallback query');
          query = supabase
            .from('it_requests')
            .select(`
              *,
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

          const { data: fallbackData, error: fallbackError } = await query;
          if (fallbackError) throw fallbackError;
          return { data: fallbackData || [] };
        }

        if (error) throw error;

        // Apply role-based filtering for view data
        let filteredData = data || [];
        if (userRole === 'employee' || (!userRole && userId)) {
          filteredData = filteredData.filter(request => request.requester_id === userId);
        }

        // Apply filters
        if (filters.status) {
          filteredData = filteredData.filter(request => request.status === filters.status);
        }
        if (filters.category_id) {
          filteredData = filteredData.filter(request => request.category_id === filters.category_id);
        }
        if (filters.priority_id) {
          filteredData = filteredData.filter(request => request.priority_id === filters.priority_id);
        }
        if (filters.requester_id) {
          filteredData = filteredData.filter(request => request.requester_id === filters.requester_id);
        }
        if (filters.assigned_to) {
          filteredData = filteredData.filter(request => request.assigned_to === filters.assigned_to);
        }
        if (filters.request_type) {
          filteredData = filteredData.filter(request => request.request_type === filters.request_type);
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredData = filteredData.filter(request => 
            request.title?.toLowerCase().includes(searchTerm) ||
            request.description?.toLowerCase().includes(searchTerm) ||
            request.request_number?.toLowerCase().includes(searchTerm)
          );
        }

        return { data: filteredData };
      } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        // Try view first, fallback to base table
        let query = supabase
          .from('it_request_details')
          .select('*')
          .eq('id', id)
          .single();

        const { data, error } = await query;
        
        if (error && (error.code === 'PGRST116' || error.status === 404 || error.code === '42P01')) {
          // Fallback to base table with joins
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('it_requests')
            .select(`
              *,
              category:category_id(name, description, icon, color),
              priority:priority_id(name, level, color, sla_hours, description)
            `)
            .eq('id', id)
            .single();
          
          if (fallbackError) throw fallbackError;
          return fallbackData;
        }

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching request:', error);
        throw error;
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

    // Update request status
    updateStatus: async (id, status, notes = null, assignedTo = null) => {
      try {
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
      } catch (error) {
        console.error('Error updating request status:', error);
        throw error;
      }
    },

    // Assign request to tech support
    assignRequest: async (id, assignedTo) => {
      try {
        const { data, error } = await supabase
          .from('it_requests')
          .update({
            assigned_to: assignedTo,
            assigned_at: new Date().toISOString(),
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error assigning request:', error);
        throw error;
      }
    },

    // Close request
    closeRequest: async (id, closedBy, notes = null) => {
      try {
        const { data, error } = await supabase
          .from('it_requests')
          .update({
            status: 'closed',
            closed_by: closedBy,
            closed_at: new Date().toISOString(),
            resolution_notes: notes,
            actual_completion_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error closing request:', error);
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

    // Get request statistics
    getStats: async (userId = null, userRole = null) => {
      try {
        // Try to use the database function first
        const { data, error } = await supabase
          .rpc('get_it_request_stats', {
            user_id: userId,
            user_role: userRole
          });

        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('get_it_request_stats function not found, using fallback calculation');
        // Fallback to manual calculation
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
        } catch (fallbackError) {
          console.error('Error in fallback stats calculation:', fallbackError);
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
    },

    // Get requests by status for dashboard
    getByStatus: async (status, userId = null, userRole = null) => {
      try {
        // Try view first, fallback to base table
        let query = supabase
          .from('it_request_details')
          .select('*')
          .eq('status', status)
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error && (error.code === 'PGRST116' || error.status === 404 || error.code === '42P01')) {
          // Fallback to base table with joins
          query = supabase
            .from('it_requests')
            .select(`
              *,
              category:category_id(name, description, icon, color),
              priority:priority_id(name, level, color, sla_hours, description)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });

          // Apply role-based filtering
          if (userRole === 'employee' && userId) {
            query = query.eq('requester_id', userId);
          }

          const { data: fallbackData, error: fallbackError } = await query;
          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }

        if (error) throw error;

        // Apply role-based filtering for view data
        let filteredData = data || [];
        if (userRole === 'employee' && userId) {
          filteredData = filteredData.filter(request => request.requester_id === userId);
        }

        return filteredData;
      } catch (error) {
        console.error('Error fetching requests by status:', error);
        throw error;
      }
    }
  },

  // IT Request Comments
  comments: {
    getByRequestId: async (requestId) => {
      try {
        const { data, error } = await supabase
          .from('it_request_comments')
          .select(`
            *,
            user:user_id(full_name, email, avatar_url)
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
    },

    create: async (commentData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_comments')
          .insert({
            request_id: commentData.request_id,
            user_id: commentData.user_id,
            comment: commentData.comment,
            is_internal: commentData.is_internal || false
          })
          .select(`
            *,
            user:user_id(full_name, email, avatar_url)
          `)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
      }
    },

    update: async (id, commentData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_comments')
          .update({
            comment: commentData.comment,
            is_internal: commentData.is_internal,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select(`
            *,
            user:user_id(full_name, email, avatar_url)
          `)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_request_comments')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
    }
  },

  // IT Request Attachments
  attachments: {
    getByRequestId: async (requestId) => {
      try {
        const { data, error } = await supabase
          .from('it_request_attachments')
          .select(`
            *,
            user:user_id(full_name, email)
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching attachments:', error);
        throw error;
      }
    },

    create: async (attachmentData) => {
      try {
        const { data, error } = await supabase
          .from('it_request_attachments')
          .insert({
            request_id: attachmentData.request_id,
            user_id: attachmentData.user_id,
            file_name: attachmentData.file_name,
            file_size: attachmentData.file_size,
            file_type: attachmentData.file_type,
            file_url: attachmentData.file_url
          })
          .select(`
            *,
            user:user_id(full_name, email)
          `)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating attachment:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_request_attachments')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting attachment:', error);
        throw error;
      }
    }
  },

  // IT Tickets
  tickets: {
    getAll: async (filters = {}) => {
      try {
        let query = supabase
          .from('it_tickets')
          .select(`
            *,
            request:request_id(title, request_number),
            assigned:assigned_to(full_name, email, avatar_url),
            priority:priority_id(name, level, color, sla_hours)
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.priority_id) {
          query = query.eq('priority_id', filters.priority_id);
        }
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
        if (filters.request_id) {
          query = query.eq('request_id', filters.request_id);
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,ticket_number.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data: data || [] };
      } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('it_tickets')
          .select(`
            *,
            request:request_id(title, request_number),
            assigned:assigned_to(full_name, email, avatar_url),
            priority:priority_id(name, level, color, sla_hours)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching ticket:', error);
        throw error;
      }
    },

    create: async (ticketData) => {
      try {
        const { data, error } = await supabase
          .from('it_tickets')
          .insert({
            title: ticketData.title,
            description: ticketData.description,
            request_id: ticketData.request_id || null,
            priority_id: ticketData.priority_id,
            assigned_to: ticketData.assigned_to || null,
            estimated_time_minutes: ticketData.estimated_time_minutes || null,
            status: 'open'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }
    },

    update: async (id, updateData) => {
      try {
        const { data, error } = await supabase
          .from('it_tickets')
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
        console.error('Error updating ticket:', error);
        throw error;
      }
    },

    updateStatus: async (id, status, notes = null) => {
      try {
        const updateData = {
          status,
          updated_at: new Date().toISOString()
        };

        if (notes) {
          updateData.resolution_notes = notes;
        }

        if (status === 'resolved') {
          updateData.resolved_at = new Date().toISOString();
        }

        if (status === 'closed') {
          updateData.closed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('it_tickets')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating ticket status:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_tickets')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting ticket:', error);
        throw error;
      }
    }
  }
};

export default itServicesApi;
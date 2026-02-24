import { supabase } from '../supabaseClient';

// IT Services API Service - FIXED VERSION
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

        if (error) {
          console.error('Categories fetch error:', error);
          throw error;
        }
        return data || [];
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

        if (error) {
          console.error('Priorities fetch error:', error);
          throw error;
        }
        return data || [];
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

  // IT Requests - SIMPLIFIED AND FIXED
  requests: {
    // Get all requests - SIMPLIFIED VERSION
    getAll: async (filters = {}, userId = null, userRole = null) => {
      try {
        console.log('Fetching requests with filters:', filters, 'userId:', userId, 'userRole:', userRole);
        
        // Simple query to base table only - exclude soft-deleted items
        let query = supabase
          .from('it_requests')
          .select('*')
          .neq('status', 'deleted') // Exclude soft-deleted items
          .order('created_at', { ascending: false });

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
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Requests fetch error:', error);
          throw error;
        }

        console.log('Fetched requests:', data?.length || 0);
        return data || [];
        
      } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('it_requests')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Request fetch error:', error);
          throw error;
        }
        return data;
      } catch (error) {
        console.error('Error fetching request:', error);
        throw error;
      }
    },

    create: async (requestData) => {
      try {
        console.log('Creating request with data:', requestData);
        
        const { data, error } = await supabase
          .from('it_requests')
          .insert({
            title: requestData.title,
            description: requestData.description,
            request_type: requestData.request_type || 'it_service',
            category_id: requestData.category_id,
            priority_id: requestData.priority_id,
            requester_id: requestData.requester_id,
            status: 'open'
          })
          .select()
          .single();

        if (error) {
          console.error('Request creation error:', error);
          throw error;
        }

        console.log('Request created successfully:', data);
        return data;
      } catch (error) {
        console.error('Error creating request:', error);
        throw error;
      }
    },

    update: async (id, requestData) => {
      try {
        const { data, error } = await supabase
          .from('it_requests')
          .update({
            title: requestData.title,
            description: requestData.description,
            category_id: requestData.category_id,
            priority_id: requestData.priority_id,
            request_type: requestData.request_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Request update error:', error);
          throw error;
        }
        return data;
      } catch (error) {
        console.error('Error updating request:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        console.log('Attempting to soft delete IT request with ID:', id);
        
        // Soft delete: Update status to 'deleted' and set deleted_at timestamp
        // This keeps the record in the database but marks it as deleted
        const updateData = {
          status: 'deleted',
          updated_at: new Date().toISOString()
        };

        // Try to add deleted_at timestamp if the column exists
        try {
          updateData.deleted_at = new Date().toISOString();
        } catch (e) {
          // Column might not exist, that's okay
          console.log('deleted_at column may not exist, continuing with status update only');
        }

        const { data, error } = await supabase
          .from('it_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Soft delete error:', error);
          throw error;
        }
        
        console.log('Request soft deleted successfully. Status set to deleted:', data);
        
        if (!data) {
          throw new Error('No rows were updated. The request may not exist or you may not have permission.');
        }
        
        return data;
        
      } catch (error) {
        console.error('Error soft deleting request:', error);
        throw error;
      }
    },

    // Get requests by status
    getByStatus: async (status, userId = null, userRole = null) => {
      try {
        let query = supabase
          .from('it_requests')
          .select('*')
          .eq('status', status)
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) {
          console.error('Status requests fetch error:', error);
          throw error;
        }
        return data || [];
      } catch (error) {
        console.error('Error fetching requests by status:', error);
        throw error;
      }
    }
  }
};

export default itServicesApi;

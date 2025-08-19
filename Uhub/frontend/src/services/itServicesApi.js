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
        .order('name');
      
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
    getAll: async (filters = {}) => {
      let query = supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
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
      if (filters.requester_id) {
        query = query.eq('requester_id', filters.requester_id);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.request_type) {
        query = query.eq('request_type', filters.request_type);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon, description),
          priority:it_request_priorities(name, level, color, sla_hours, description),
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
        .insert(requestData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id, requestData) => {
      const { data, error } = await supabase
        .from('it_requests')
        .update(requestData)
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

    // Get requests by user
    getByUser: async (userId, filters = {}) => {
      let query = supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position)
        `)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },

    // Get assigned requests
    getAssigned: async (userId, filters = {}) => {
      let query = supabase
        .from('it_requests')
        .select(`
          *,
          category:it_request_categories(name, color, icon),
          priority:it_request_priorities(name, level, color, sla_hours),
          requester:requester_id(full_name, email, department, position),
          assignee:assigned_to(full_name, email, department, position)
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  },

  // IT Tickets
  tickets: {
    getAll: async (filters = {}) => {
      let query = supabase
        .from('it_tickets')
        .select(`
          *,
          request:it_requests(request_number, title, request_type),
          priority:it_request_priorities(name, level, color, sla_hours),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
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

      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('it_tickets')
        .select(`
          *,
          request:it_requests(request_number, title, request_type, description),
          priority:it_request_priorities(name, level, color, sla_hours, description),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    create: async (ticketData) => {
      const { data, error } = await supabase
        .from('it_tickets')
        .insert(ticketData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id, ticketData) => {
      const { data, error } = await supabase
        .from('it_tickets')
        .update(ticketData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('it_tickets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Get tickets by user
    getByUser: async (userId, filters = {}) => {
      let query = supabase
        .from('it_tickets')
        .select(`
          *,
          request:it_requests(request_number, title, request_type),
          priority:it_request_priorities(name, level, color, sla_hours),
          assignee:assigned_to(full_name, email, department, position)
        `)
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },

    // Get tickets by request
    getByRequest: async (requestId) => {
      const { data, error } = await supabase
        .from('it_tickets')
        .select(`
          *,
          priority:it_request_priorities(name, level, color, sla_hours),
          assignee:assigned_to(full_name, email, department, position),
          closed_by_user:closed_by(full_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  // IT Assets
  assets: {
    getAll: async (filters = {}) => {
      let query = supabase
        .from('it_assets')
        .select(`
          *,
          assigned_employee:assigned_to(full_name, email, department, position)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('it_assets')
        .select(`
          *,
          assigned_employee:assigned_to(full_name, email, department, position)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    create: async (assetData) => {
      const { data, error } = await supabase
        .from('it_assets')
        .insert(assetData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    update: async (id, assetData) => {
      const { data, error } = await supabase
        .from('it_assets')
        .update(assetData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('it_assets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    // Assign asset to employee
    assign: async (assetId, employeeId, assignedBy, notes = '') => {
      // Update asset status and assignment
      const { data: assetUpdate, error: assetError } = await supabase
        .from('it_assets')
        .update({
          assigned_to: employeeId,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('id', assetId)
        .select()
        .single();

      if (assetError) throw assetError;

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('it_asset_assignments')
        .insert({
          asset_id: assetId,
          employee_id: employeeId,
          assigned_by: assignedBy,
          notes
        });

      if (assignmentError) throw assignmentError;

      return assetUpdate;
    },

    // Return asset
    return: async (assetId, returnedTo, notes = '') => {
      // Update asset status
      const { data: assetUpdate, error: assetError } = await supabase
        .from('it_assets')
        .update({
          assigned_to: null,
          assigned_at: null,
          status: 'available'
        })
        .eq('id', assetId)
        .select()
        .single();

      if (assetError) throw assetError;

      // Update assignment record
      const { error: assignmentError } = await supabase
        .from('it_asset_assignments')
        .update({
          returned_at: new Date().toISOString(),
          returned_to: returnedTo,
          notes
        })
        .eq('asset_id', assetId)
        .is('returned_at', null);

      if (assignmentError) throw assignmentError;

      return assetUpdate;
    }
  },

  // Dashboard Statistics
  dashboard: {
    getStats: async () => {
      const { data, error } = await supabase
        .from('it_dashboard_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },

    getRecentRequests: async (limit = 10) => {
      const { data, error } = await supabase
        .from('it_requests')
        .select(`
          id,
          request_number,
          title,
          status,
          created_at,
          category:it_request_categories(name, color),
          priority:it_request_priorities(name, color),
          requester:requester_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },

    getRecentTickets: async (limit = 10) => {
      const { data, error } = await supabase
        .from('it_tickets')
        .select(`
          id,
          ticket_number,
          title,
          status,
          created_at,
          priority:it_request_priorities(name, color),
          assignee:assigned_to(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    }
  }
};

export default itServicesApi;

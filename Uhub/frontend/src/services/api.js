import { supabase } from '../supabaseClient';

// API Service Layer for centralized data fetching
export const apiService = {
  // Employee APIs
  employees: {
    getAll: async (page = 1, limit = 50, search = '') => {
      let query = supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_id,
          department,
          position,
          email,
          status,
          profile_picture,
          created_at,
          reporting_manager:reporting_manager_id (
            full_name,
            employee_id
          )
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,department.ilike.%${search}%,position.ilike.%${search}%,employee_id.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          reporting_manager:reporting_manager_id (
            full_name,
            employee_id
          ),
          assets (
            id,
            name,
            type,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (employeeData) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, employeeData) => {
      // Clear any existing profile picture if it's being set to null
      if (employeeData.profile_picture === null || employeeData.photo_url === null) {
        // Force a cache invalidation for this employee
        employeeData.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // Asset APIs
  assets: {
    getAll: async (page = 1, limit = 50, filters = {}) => {
      let query = supabase
        .from('assets')
        .select(`
          id, 
          name, 
          type, 
          status, 
          created_at, 
          assigned_to,
          asset_code,
          lpo_number,
          purchase_price,
          purchase_date,
          supplier,
          asset_picture_url,
          assigned_employee:assigned_to (
            id,
            full_name,
            employee_id
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,type.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%,lpo_number.ilike.%${filters.search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          status,
          created_at,
          assigned_to,
          asset_code,
          lpo_number,
          purchase_price,
          purchase_date,
          supplier,
          asset_picture_url,
          assigned_employee:assigned_to (
            id,
            full_name,
            employee_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (assetData) => {
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, assetData) => {
      const { data, error } = await supabase
        .from('assets')
        .update(assetData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // Expense APIs
  expenses: {
    getAll: async (page = 1, limit = 100, filters = {}) => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date_paid', { ascending: false });

      // Apply filters
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('date_paid', startDate).lte('date_paid', endDate);
      }
      if (filters.startDate) query = query.gte('date_paid', filters.startDate);
      if (filters.endDate) query = query.lte('date_paid', filters.endDate);
      if (filters.userId) query = query.eq('user_id', filters.userId);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count };
    },

    getStats: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount_aed, date_paid, department, service_name');

      if (error) throw error;
      return data;
    },

    create: async (expenseData) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, expenseData) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // User Profile APIs
  userProfile: {
    get: async (userId) => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },

    update: async (userId, profileData) => {
      const { data, error } = await supabase
        .from('employees')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // For UserProfile page that uses 'users' table
    getUserProfile: async (userId) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },

    updateUserProfile: async (userId, profileData) => {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // User Management APIs
  userManagement: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected format
      return data.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        full_name: user.email, // Use email as display name for now
        department: 'N/A', // Will be populated when linked to employee
        position: 'N/A', // Will be populated when linked to employee
        phone: 'N/A', // Will be populated when linked to employee
        location: 'N/A', // Will be populated when linked to employee
        created_at: user.created_at,
        auth_user_id: user.auth_user_id,
        employee_id: user.employee_id
      }));
    },

    create: async (userData) => {
      // Create user account only (not employee record)
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          role: userData.role,
          status: userData.status
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, userData) => {
      // Update user account only
      const { data, error } = await supabase
        .from('users')
        .update({
          role: userData.role,
          status: userData.status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      // Delete user account only (NOT employee record)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    toggleStatus: async (id, status) => {
      // Toggle user account status only
      const { data, error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Access Management APIs
  accessManagement: {
    getRequests: async () => {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    updateRequest: async (id, requestData) => {
      const { data, error } = await supabase
        .from('access_requests')
        .update(requestData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Attendance APIs
  attendance: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },

    create: async (attendanceData) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getStats: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*');

      if (error) throw error;
      return data;
    }
  },

  // Payment Events APIs
  paymentEvents: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('payment_events')
        .select('id, user_id, amount, currency, status, description, due_date, created_at, updated_at')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },

    create: async (eventData) => {
      const { data, error } = await supabase
        .from('payment_events')
        .insert({
          user_id: eventData.user_id,
          amount: eventData.amount,
          currency: eventData.currency || 'AED',
          status: eventData.status || 'pending',
          description: eventData.description,
          due_date: eventData.due_date
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, eventData) => {
      const { data, error } = await supabase
        .from('payment_events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('payment_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // Driver APIs
  drivers: {
    getAll: async (page = 1, limit = 50, search = '') => {
      let query = supabase
        .from('drivers')
        .select(`
          id,
          full_name,
          employee_id,
          designation,
          nationality,
          company_mobile,
          personal_mobile,
          emirates_id_no,
          driving_license_no,
          udrive_customer_account_id,
          service_car_plate,
          team_type,
          team_name,
          team_members,
          shift_type,
          profile_picture,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,designation.ilike.%${search}%,employee_id.ilike.%${search}%,team_type.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (driverData) => {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driverData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, driverData) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(driverData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  }
};

// Error handler
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.code === 'PGRST116') {
    return 'No data found';
  }
  
  if (error.code === '42501') {
    return 'Access denied. Please check your permissions.';
  }
  
  if (error.code === '23505') {
    return 'This record already exists.';
  }
  
  return error.message || 'An unexpected error occurred';
}; 
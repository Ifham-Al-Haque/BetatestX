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
          phone,
          location,
          hire_date,
          profile_picture,
          photo_url,
          created_at,
          performance_rating,
          termination_date,
          reporting_manager:reporting_manager_id (
            full_name,
            employee_id
          )
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,department.ilike.%${search}%,position.ilike.%${search}%,employee_id.ilike.%${search}%,phone.ilike.%${search}%,location.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // First get the total count
      const { count: totalCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Then get the paginated data
      const { data, error } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count: totalCount };
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
      try {
        // Get current user's email from Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser || !authUser.email) {
          throw new Error("No auth user or email found");
        }
        
        // Try to get user profile from the users table by email
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          return data;
        }
        
        // If no user found, create a default user profile
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: authUser.email,
            auth_user_id: userId,
            role: 'employee', // Default role
            status: 'active',
            full_name: authUser.email.split('@')[0],
            department: 'Unassigned',
            position: 'Employee'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newUser;
        
      } catch (error) {
        console.error("Error in getUserProfile:", error);
        throw error;
      }
    },

    updateUserProfile: async (userId, profileData) => {
      try {
        // Get current user's email from Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser || !authUser.email) {
          throw new Error("No auth user or email found");
        }
        
        // Check if user exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', authUser.email)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        let result;
        
        if (existingUser) {
          // Update existing user
          const { data, error } = await supabase
            .from('users')
            .update({
              ...profileData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        } else {
          // Create new user if doesn't exist
          const { data, error } = await supabase
            .from('users')
            .insert({
              email: authUser.email,
              auth_user_id: userId,
              ...profileData,
              role: profileData.role || 'employee',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        }
        
        return result;
        
      } catch (error) {
        console.error("Error in updateUserProfile:", error);
        throw error;
      }
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
      
      // Ensure ALL users have the same structure with default values
      return data.map(user => ({
        // Required fields with fallbacks
        id: user.id || null,
        email: user.email || '',
        role: user.role || 'employee',
        status: user.status || 'active',
        
        // Optional fields with consistent defaults
        full_name: user.full_name || user.email || 'N/A',
        department: user.department || 'N/A',
        position: user.position || 'N/A',
        phone: user.phone || 'N/A',
        location: user.location || 'N/A',
        
        // Timestamps
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        
        // Auth-related fields
        auth_user_id: user.auth_user_id || null,
        employee_id: user.employee_id || null,
        
        // Additional fields that might be expected
        is_active: user.status === 'active',
        last_login: user.last_login || null,
        permissions: user.permissions || []
      }));
    },

          create: async (userData) => {
        console.log('🚀 Starting user creation process...');
        console.log('📝 User data received:', userData);
        
        try {
          let authUserId = null;
          let authError = null;

                // If password is provided, create the auth user first
        if (userData.password) {
          try {
            console.log('🔐 Creating auth user for:', userData.email);
            
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
              email: userData.email,
              password: userData.password,
              options: {
                data: {
                  role: userData.role,
                  full_name: userData.email.split('@')[0]
                }
              }
            });

            console.log('🔐 Auth signup result:', { authData, signUpError });

            if (signUpError) {
              console.error('❌ Auth signup failed:', signUpError);
              console.error('❌ Error details:', {
                message: signUpError.message,
                status: signUpError.status,
                name: signUpError.name,
                details: signUpError.details,
                hint: signUpError.hint
              });
              authError = signUpError;
            } else         if (authData.user) {
          console.log('✅ Auth user created successfully:', authData.user.id);
          console.log('📧 User email confirmed:', authData.user.email_confirmed_at);
          console.log('📧 Session:', authData.session);
          authUserId = authData.user.id;
        } else {
          console.warn('⚠️ No auth user data returned');
          console.warn('⚠️ Full auth response:', authData);
        }
          } catch (authException) {
            console.error('💥 Exception during auth signup:', authException);
            authError = authException;
          }
        }

        // Create user account in the database
        console.log('💾 Creating database user for:', userData.email);
        console.log('💾 Auth user ID:', authUserId);
        
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            role: userData.role,
            status: userData.status,
            auth_user_id: authUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        console.log('💾 Database user creation result:', { data, error });

        if (error) throw error;
        
        // Transform the response to match the expected format
        return {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          full_name: data.email,
          department: 'N/A',
          position: 'N/A',
          phone: 'N/A',
          location: 'N/A',
          created_at: data.created_at,
          updated_at: data.updated_at,
          auth_user_id: data.auth_user_id,
          employee_id: null,
          is_active: data.status === 'active',
          last_login: null,
          permissions: []
        };
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
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
      
      // Transform the response to match the expected format
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        full_name: data.full_name || data.email,
        department: data.department || 'N/A',
        position: data.position || 'N/A',
        phone: data.phone || 'N/A',
        location: data.location || 'N/A',
        created_at: data.created_at,
        updated_at: data.updated_at,
        auth_user_id: data.auth_user_id || null,
        employee_id: data.employee_id || null,
        is_active: data.status === 'active',
        last_login: data.last_login || null,
        permissions: data.permissions || []
      };
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
      
      // Transform the response to match the expected format
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        full_name: data.full_name || data.email,
        department: data.department || 'N/A',
        position: data.position || 'N/A',
        phone: data.phone || 'N/A',
        location: data.location || 'N/A',
        created_at: data.created_at,
        updated_at: data.updated_at,
        auth_user_id: data.auth_user_id || null,
        employee_id: data.employee_id || null,
        is_active: data.status === 'active',
        last_login: data.last_login || null,
        permissions: data.permissions || []
      };
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
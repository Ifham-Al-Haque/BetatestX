// Fix for "All object keys must match" Error
// This error typically occurs when spreading objects with different structures

// Common causes and solutions:

// 1. Data structure mismatch between API response and expected format
// The API returns data with different keys than what the component expects

// 2. Inconsistent object spreading
// When spreading objects that might have undefined or null values

// 3. Missing properties in transformed data

// SOLUTION: Ensure consistent data structure in API responses

// In src/services/api.js, modify the userManagement.getAll function:

export const userManagement = {
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
    // Ensure the created user has the same structure
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

  update: async (id, userData) => {
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
  }
};

// ALTERNATIVE SOLUTION: Use a data normalizer function

export const normalizeUserData = (user) => {
  // Ensure all users have the same structure
  const normalized = {
    // Required fields
    id: null,
    email: '',
    role: 'employee',
    status: 'active',
    
    // Optional fields
    full_name: '',
    department: 'N/A',
    position: 'N/A',
    phone: 'N/A',
    location: 'N/A',
    
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Auth fields
    auth_user_id: null,
    employee_id: null,
    
    // Computed fields
    is_active: false,
    last_login: null,
    permissions: []
  };
  
  // Override with actual data, ensuring no undefined values
  if (user) {
    Object.keys(normalized).forEach(key => {
      if (user[key] !== undefined && user[key] !== null) {
        normalized[key] = user[key];
      }
    });
    
    // Handle computed fields
    normalized.is_active = normalized.status === 'active';
  }
  
  return normalized;
};

// Usage in API functions:
// return data.map(normalizeUserData);

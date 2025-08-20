import { supabase } from '../supabaseClient';

// Enhanced Employee Management API Service
export const enhancedEmployeeApi = {
  // Enhanced Employee CRUD with new fields
  employees: {
    getAll: async (page = 1, limit = 50, search = '', filters = {}) => {
      let query = supabase
        .from('employees')
        .select(`
          *,
          reporting_manager:reporting_manager_id ( full_name, name, employee_id ),
          documents:employee_documents(count),
          skills:employee_skills(count),
          goals:employee_goals(count),
          performance_reviews:employee_performance_reviews(count),
          leave_requests:employee_leave_requests(count)
        `)
        .order('created_at', { ascending: false });

      // Apply search filters
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,department.ilike.%${search}%,position.ilike.%${search}%,employee_id.ilike.%${search}%,skills.ilike.%${search}%`);
      }

      // Apply advanced filters
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.experience_level) query = query.eq('experience_level', filters.experience_level);
      if (filters.location) query = query.eq('location', filters.location);
      if (filters.performance_rating_min) query = query.gte('performance_rating', filters.performance_rating_min);
      if (filters.performance_rating_max) query = query.lte('performance_rating', filters.performance_rating_max);
      if (filters.salary_min) query = query.gte('salary', filters.salary_min);
      if (filters.salary_max) query = query.lte('salary', filters.salary_max);
      if (filters.hire_date_from) query = query.gte('hire_date', filters.hire_date_from);
      if (filters.hire_date_to) query = query.lte('hire_date', filters.hire_date_to);
      if (filters.data_completeness_min) query = query.gte('data_completeness_score', filters.data_completeness_min);

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
          reporting_manager:reporting_manager_id ( full_name, name, employee_id ),
          documents:employee_documents(*),
          skills:employee_skills(*),
          goals:employee_goals(*),
          performance_reviews:employee_performance_reviews(*),
          leave_requests:employee_leave_requests(*),
          work_history:employee_work_history(*),
          onboarding:employee_onboarding(*),
          attendance:employee_attendance(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, employeeData) => {
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Bulk operations
    bulkUpdate: async (employeeIds, updateData) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .in('id', employeeIds)
        .select();

      if (error) throw error;
      return data;
    },

    // Export functionality
    exportData: async (filters = {}) => {
      let query = supabase
        .from('employees')
        .select(`
          full_name,
          employee_id,
          email,
          department,
          position,
          hire_date,
          salary,
          performance_rating,
          experience_level,
          location,
          status,
          data_completeness_score
        `);

      // Apply filters
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.experience_level) query = query.eq('experience_level', filters.experience_level);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  },

  // Document Management
  documents: {
    upload: async (documentData) => {
      const { data, error } = await supabase
        .from('employee_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    delete: async (documentId) => {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      return true;
    }
  },

  // Skills Management
  skills: {
    add: async (skillData) => {
      const { data, error } = await supabase
        .from('employee_skills')
        .insert(skillData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_skills')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    update: async (skillId, skillData) => {
      const { data, error } = await supabase
        .from('employee_skills')
        .update(skillData)
        .eq('id', skillId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (skillId) => {
      const { error } = await supabase
        .from('employee_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;
      return true;
    }
  },

  // Goals Management
  goals: {
    add: async (goalData) => {
      const { data, error } = await supabase
        .from('employee_goals')
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_goals')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    update: async (goalId, goalData) => {
      const { data, error } = await supabase
        .from('employee_goals')
        .update(goalData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (goalId) => {
      const { error } = await supabase
        .from('employee_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      return true;
    }
  },

  // Performance Reviews
  performanceReviews: {
    create: async (reviewData) => {
      const { data, error } = await supabase
        .from('employee_performance_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_performance_reviews')
        .select(`
          *,
          reviewer:reviewer_id ( full_name, employee_id )
        `)
        .eq('employee_id', employeeId)
        .order('review_date', { ascending: false });

      if (error) throw error;
      return data;
    },

    update: async (reviewId, reviewData) => {
      const { data, error } = await supabase
        .from('employee_performance_reviews')
        .update(reviewData)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Leave Management
  leaveRequests: {
    create: async (leaveData) => {
      const { data, error } = await supabase
        .from('employee_leave_requests')
        .insert(leaveData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_leave_requests')
        .select(`
          *,
          approver:approved_by ( full_name, employee_id )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    approve: async (requestId, approverId, notes = '') => {
      const { data, error } = await supabase
        .from('employee_leave_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          notes: notes
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    reject: async (requestId, approverId, notes = '') => {
      const { data, error } = await supabase
        .from('employee_leave_requests')
        .update({
          status: 'rejected',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          notes: notes
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Onboarding Management
  onboarding: {
    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_onboarding')
        .select('*')
        .eq('employee_id', employeeId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },

    markComplete: async (itemId, completedBy) => {
      const { data, error } = await supabase
        .from('employee_onboarding')
        .update({
          is_completed: true,
          completed_by: completedBy,
          completed_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Work History
  workHistory: {
    add: async (historyData) => {
      const { data, error } = await supabase
        .from('employee_work_history')
        .insert(historyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_work_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    }
  },

  // Saved Searches
  savedSearches: {
    save: async (searchData) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert(searchData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByUser: async (userId) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    delete: async (searchId) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
      return true;
    }
  },

  // Analytics and Reporting
  analytics: {
    getDepartmentStats: async () => {
      const { data, error } = await supabase
        .from('employee_analytics')
        .select('*');

      if (error) throw error;
      return data;
    },

    getSkillsGapAnalysis: async () => {
      const { data, error } = await supabase
        .from('employee_skills')
        .select(`
          skill_name,
          skill_level,
          department:employees!inner(department)
        `);

      if (error) throw error;
      return data;
    },

    getTurnoverAnalysis: async (startDate, endDate) => {
      const { data, error } = await supabase
        .from('employees')
        .select('hire_date, termination_date, department')
        .gte('hire_date', startDate)
        .lte('hire_date', endDate);

      if (error) throw error;
      return data;
    },

    getDataCompletenessReport: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, department, data_completeness_score')
        .order('data_completeness_score', { ascending: true });

      if (error) throw error;
      return data;
    }
  },

  // Attendance Management
  attendance: {
    record: async (attendanceData) => {
      const { data, error } = await supabase
        .from('employee_attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByEmployee: async (employeeId, startDate, endDate) => {
      let query = supabase
        .from('employee_attendance')
        .select('*')
        .eq('employee_id', employeeId);

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query.order('date', { ascending: true });
      if (error) throw error;
      return data;
    },

    update: async (attendanceId, attendanceData) => {
      const { data, error } = await supabase
        .from('employee_attendance')
        .update(attendanceData)
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Emergency Contacts
  emergencyContacts: {
    update: async (employeeId, contactData) => {
      const { data, error } = await supabase
        .from('employees')
        .update({
          emergency_contact_name: contactData.emergency_contact_name,
          emergency_contact_phone: contactData.emergency_contact_phone,
          emergency_contact_relationship: contactData.emergency_contact_relationship,
          next_of_kin_name: contactData.next_of_kin_name,
          next_of_kin_phone: contactData.next_of_kin_phone,
          next_of_kin_relationship: contactData.next_of_kin_relationship
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
};

// Utility functions
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = async (data, filename) => {
  // This would require a library like xlsx
  // For now, we'll use CSV export
  exportToCSV(data, filename);
};

// Validation functions
export const validateEmployeeData = (data) => {
  const errors = [];

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please enter a valid email address');
  }

  if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('Please enter a valid phone number');
  }

  if (data.salary && data.salary < 0) {
    errors.push('Salary cannot be negative');
  }

  if (data.performance_rating && (data.performance_rating < 0 || data.performance_rating > 5)) {
    errors.push('Performance rating must be between 0 and 5');
  }

  return errors;
};

export const calculateDataCompleteness = (employee) => {
  const requiredFields = [
    'full_name', 'email', 'phone', 'department', 'position', 'employee_id',
    'hire_date', 'location', 'emergency_contact_name', 'emergency_contact_phone',
    'next_of_kin_name', 'next_of_kin_phone', 'salary', 'performance_rating',
    'experience_level', 'summary', 'scopes', 'responsibilities', 'duties',
    'reporting_manager_id'
  ];

  const filledFields = requiredFields.filter(field => {
    const value = employee[field];
    return value !== null && value !== undefined && value !== '' && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
};

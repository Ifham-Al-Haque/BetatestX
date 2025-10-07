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
    // Get all requests with role-based filtering (User-based architecture)
    getAll: async (filters = {}, userId = null, userRole = null) => {
      try {
        // Try to use the enhanced view first, fallback to base table if view doesn't exist
        let query = supabase
          .from('it_requests_with_details')
          .select('*')
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        
        // If view doesn't exist (404, PGRST116, or 42P01), fallback to base table
        if (error && (error.code === 'PGRST116' || error.status === 404 || error.code === '42P01')) {
          console.warn('it_requests_with_details view not found, using fallback query');
          query = supabase
            .from('it_requests')
            .select(`
              *,
              category:category_id(name, description, icon, color),
              priority:priority_id(name, level, color, sla_hours, description),
              requester:requester_id(
                full_name,
                email,
                department,
                role
              )
            `)
            .order('created_at', { ascending: false });

          // Apply role-based filtering - non-IT users see only their own requests
          if (!userRole || !['admin', 'it_manager', 'it_technician', 'super_admin'].includes(userRole)) {
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
          
          // If requester information is missing in fallback data, fetch it separately
          let processedData = fallbackData || [];
          if (processedData.length > 0 && (!processedData[0].requester || !processedData[0].requester.full_name)) {
            console.log('Fetching requester information for fallback data...');
            const requesterIds = [...new Set(processedData.map(req => req.requester_id).filter(Boolean))];
            
            if (requesterIds.length > 0) {
              try {
                console.log('Requester IDs to fetch:', requesterIds);
                
                // Try multiple approaches to get user data
                let requesterMap = {};
                let userDataFound = false;

                // Approach 1: Try users table with auth_user_id mapping
                try {
                  const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, auth_user_id, full_name, email, department, role')
                    .in('auth_user_id', requesterIds);

                  if (!usersError && usersData && usersData.length > 0) {
                    console.log('Found users data:', usersData);
                    usersData.forEach(user => {
                      requesterMap[user.auth_user_id] = {
                        full_name: user.full_name,
                        email: user.email,
                        department: user.department,
                        role: user.role
                      };
                    });
                    userDataFound = true;
                  }
                } catch (usersError) {
                  console.log('Users table query failed:', usersError);
                }

                // Approach 2: Try employees table with auth_user_id mapping
                if (!userDataFound) {
                  try {
                    const { data: employeesData, error: employeesError } = await supabase
                      .from('employees')
                      .select('id, auth_user_id, full_name, email, department, role')
                      .in('auth_user_id', requesterIds);

                    if (!employeesError && employeesData && employeesData.length > 0) {
                      console.log('Found employees data:', employeesData);
                      employeesData.forEach(emp => {
                        requesterMap[emp.auth_user_id] = {
                          full_name: emp.full_name,
                          email: emp.email,
                          department: emp.department,
                          role: emp.role
                        };
                      });
                      userDataFound = true;
                    }
                  } catch (employeesError) {
                    console.log('Employees table query failed:', employeesError);
                  }
                }

                // Approach 3: Try direct ID matching (for cases where requester_id is the actual user/employee ID)
                if (!userDataFound) {
                  try {
                    const { data: usersData, error: usersError } = await supabase
                      .from('users')
                      .select('id, full_name, email, department, role')
                      .in('id', requesterIds);

                    if (!usersError && usersData && usersData.length > 0) {
                      console.log('Found users data by direct ID:', usersData);
                      usersData.forEach(user => {
                        requesterMap[user.id] = {
                          full_name: user.full_name,
                          email: user.email,
                          department: user.department,
                          role: user.role
                        };
                      });
                      userDataFound = true;
                    }
                  } catch (usersError) {
                    console.log('Direct users table query failed:', usersError);
                  }
                }

                if (!userDataFound) {
                  try {
                    const { data: employeesData, error: employeesError } = await supabase
                      .from('employees')
                      .select('id, full_name, email, department, role')
                      .in('id', requesterIds);

                    if (!employeesError && employeesData && employeesData.length > 0) {
                      console.log('Found employees data by direct ID:', employeesData);
                      employeesData.forEach(emp => {
                        requesterMap[emp.id] = {
                          full_name: emp.full_name,
                          email: emp.email,
                          department: emp.department,
                          role: emp.role
                        };
                      });
                      userDataFound = true;
                    }
                  } catch (employeesError) {
                    console.log('Direct employees table query failed:', employeesError);
                  }
                }

                console.log('Final requester map:', requesterMap);

                // Merge requester information
                processedData = processedData.map(request => ({
                  ...request,
                  requester: requesterMap[request.requester_id] || {
                    full_name: 'Unknown User',
                    email: null,
                    department: null,
                    role: null
                  }
                }));

              } catch (fetchError) {
                console.error('Error fetching requester information for fallback:', fetchError);
                // Set default requester info on error
                processedData = processedData.map(request => ({
                  ...request,
                  requester: {
                    full_name: 'Unknown User',
                    email: null,
                    department: null,
                    role: null
                  }
                }));
              }
            } else {
              // No valid requester IDs, set default
              processedData = processedData.map(request => ({
                ...request,
                requester: {
                  full_name: 'Unknown User',
                  email: null,
                  department: null,
                  role: null
                }
              }));
            }
          }
          
          return { data: processedData };
        }

        if (error) throw error;

        // Apply role-based filtering for view data - non-IT users see only their own requests
        let filteredData = data || [];
        if (!userRole || !['admin', 'it_manager', 'it_technician', 'super_admin'].includes(userRole)) {
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

        // If requester information is missing, fetch it separately
        if (filteredData.length > 0 && (!filteredData[0].requester || !filteredData[0].requester.full_name)) {
          console.log('Fetching requester information separately...');
          const requesterIds = [...new Set(filteredData.map(req => req.requester_id))];
          
          try {
            // Try to fetch from employees table first
            const { data: employeesData, error: employeesError } = await supabase
              .from('employees')
              .select('id, full_name, email, department, role')
              .in('id', requesterIds);

            if (!employeesError && employeesData) {
              const requesterMap = {};
              employeesData.forEach(emp => {
                requesterMap[emp.id] = {
                  full_name: emp.full_name,
                  email: emp.email,
                  department: emp.department,
                  role: emp.role
                };
              });

              // Merge requester information
              filteredData = filteredData.map(request => ({
                ...request,
                requester: requesterMap[request.requester_id] || {
                  full_name: 'Unknown User',
                  email: null,
                  department: null,
                  role: null
                }
              }));
            } else {
              // Try users table as fallback
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, full_name, email, department, role')
                .in('id', requesterIds);

              if (!usersError && usersData) {
                const requesterMap = {};
                usersData.forEach(user => {
                  requesterMap[user.id] = {
                    full_name: user.full_name,
                    email: user.email,
                    department: user.department,
                    role: user.role
                  };
                });

                // Merge requester information
                filteredData = filteredData.map(request => ({
                  ...request,
                  requester: requesterMap[request.requester_id] || {
                    full_name: 'Unknown User',
                    email: null,
                    department: null,
                    role: null
                  }
                }));
              } else {
                // If both fail, set default requester info
                filteredData = filteredData.map(request => ({
                  ...request,
                  requester: {
                    full_name: 'Unknown User',
                    email: null,
                    department: null,
                    role: null
                  }
                }));
              }
            }
          } catch (fetchError) {
            console.error('Error fetching requester information:', fetchError);
            // Set default requester info on error
            filteredData = filteredData.map(request => ({
              ...request,
              requester: {
                full_name: 'Unknown User',
                email: null,
                department: null,
                role: null
              }
            }));
          }
        }

        return { data: filteredData };
      } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        // Try enhanced view first, fallback to base table
        let query = supabase
          .from('it_requests_with_details')
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
              priority:priority_id(name, level, color, sla_hours, description),
              requester:requester_id(full_name, email, role, department)
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

        // Send notifications to IT Management and Admin roles
        try {
          // Import the simple notification service
          const { default: SimpleNotificationService } = await import('./simpleNotificationService');
          const notificationService = new SimpleNotificationService();
          await notificationService.notifyITRequestCreated(data);
          console.log('✅ IT Request notification sent successfully');
        } catch (notificationError) {
          console.error('⚠️ Failed to send IT request notification:', notificationError);
          // Don't throw error - request was created successfully
        }

        return data;
      } catch (error) {
        console.error('Error creating request:', error);
        throw error;
      }
    },

    update: async (id, updateData) => {
      try {
        console.log('🔄 Updating IT request:', id, 'with data:', updateData);
        
        // Get current request data to check for status changes
        const { data: currentRequest, error: fetchError } = await supabase
          .from('it_requests')
          .select('status')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching current request:', fetchError);
          throw fetchError;
        }

        console.log('📋 Current request status:', currentRequest?.status);

        const updatePayload = {
          ...updateData,
          updated_at: new Date().toISOString()
        };
        
        console.log('📤 Update payload:', updatePayload);

        const { data, error } = await supabase
          .from('it_requests')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating request:', error);
          throw error;
        }

        console.log('✅ Request updated successfully:', data);

        // Send notification if status changed (non-blocking)
        if (currentRequest && updateData.status && currentRequest.status !== updateData.status) {
          // Use setTimeout to make notification non-blocking
          setTimeout(async () => {
            try {
              const { default: SimpleNotificationService } = await import('./simpleNotificationService');
              const notificationService = new SimpleNotificationService();
              await notificationService.notifyITRequestStatusUpdate(data, currentRequest.status, updateData.status);
              console.log('✅ IT Request status update notification sent successfully');
            } catch (notificationError) {
              console.error('⚠️ Failed to send IT request status update notification:', notificationError);
              // This won't affect the main update operation
            }
          }, 0);
        }

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
        console.log('Attempting to delete IT request with ID:', id);
        
        // Try using the custom delete function first (bypasses RLS)
        const { data: deleteResult, error: deleteError } = await supabase
          .rpc('delete_it_request', { request_id: id });
        
        if (deleteError) {
          console.error('Custom delete function error:', deleteError);
          
          // Fallback to standard delete
          console.log('Falling back to standard delete...');
          const { data, error } = await supabase
            .from('it_requests')
            .delete()
            .eq('id', id)
            .select();

          if (error) {
            console.error('Standard delete also failed:', error);
            throw error;
          }
          
          console.log('Standard delete successful. Rows affected:', data?.length || 0);
          
          if (data && data.length === 0) {
            throw new Error('No rows were deleted. You may not have permission to delete this request or it may not exist.');
          }
          
          return true;
        }
        
        console.log('Custom delete function result:', deleteResult);
        
        if (deleteResult) {
          console.log('Request deleted successfully using custom function');
          return true;
        } else {
          throw new Error('Delete operation returned false - no rows were deleted');
        }
        
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

          // Apply role-based filtering for statistics - non-IT users see only their own requests
          if (!userRole || !['admin', 'it_manager', 'it_technician', 'super_admin'].includes(userRole)) {
            if (userId) {
              query = query.eq('requester_id', userId);
            }
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
            assigned_to_me: requests.filter(r => r.assigned_to === userId).length,
            unassigned_requests: requests.filter(r => !r.assigned_to && r.status === 'open').length
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
            assigned_to_me: 0,
            unassigned_requests: 0
          };
        }
      }
    },

    // Get requests by status for dashboard
    getByStatus: async (status, userId = null, userRole = null) => {
      try {
        // Try enhanced view first, fallback to base table
        let query = supabase
          .from('it_requests_with_details')
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
              priority:priority_id(name, level, color, sla_hours, description),
              requester:requester_id(full_name, email, role, department)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });

          // Apply role-based filtering - non-IT users see only their own requests
          if (!userRole || !['admin', 'it_manager', 'it_technician', 'super_admin'].includes(userRole)) {
            query = query.eq('requester_id', userId);
          }

          const { data: fallbackData, error: fallbackError } = await query;
          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }

        if (error) throw error;

        // Apply role-based filtering for view data - non-IT users see only their own requests
        let filteredData = data || [];
        if (!userRole || !['admin', 'it_manager', 'it_technician', 'super_admin'].includes(userRole)) {
          filteredData = filteredData.filter(request => request.requester_id === userId);
        }

        return filteredData;
      } catch (error) {
        console.error('Error fetching requests by status:', error);
        throw error;
      }
    },

    // Get all requests for tech/admin roles (for RequestInbox)
    getAllForTech: async (filters = {}) => {
      try {
        // This method is specifically for tech roles to see all requests
        const result = await itServicesApi.requests.getAll(filters, null, 'admin'); // Use admin role to see all requests
        return result.data || [];
      } catch (error) {
        console.error('Error fetching requests for tech:', error);
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
  },

  // Users and Staff Management
  users: {
    // Get IT staff users for assignment
    getITStaff: async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role, department')
          .in('role', ['admin', 'it_manager', 'it_technician', 'super_admin'])
          .eq('status', 'active')
          .order('full_name', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching IT staff:', error);
        // Fallback to all users if role filtering fails
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, role, department')
            .eq('status', 'active')
            .order('full_name', { ascending: true });
          
          if (error) throw error;
          return data || [];
        } catch (fallbackError) {
          console.error('Error in fallback user fetch:', fallbackError);
          return [];
        }
      }
    },

    // Get all users (for general purposes)
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role, department, status')
          .order('full_name', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    }
  }
};

export default itServicesApi;
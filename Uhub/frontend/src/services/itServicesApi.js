import { supabase } from '../supabaseClient';
import notificationService from './notificationService';
import { emailService } from './emailService';
import { resolveItRequestRequesterId } from './unifiedNotify';
import { canManageItRequestQueue, IT_STAFF_ROLES } from '../utils/notificationRoles';
import {
  normalizeItRequestList,
  enrichItRequestsWithAssignees,
} from '../utils/itRequestEnrichment';

async function finalizeItRequestRows(rows) {
  let list = normalizeItRequestList(rows || []);
  list = await enrichItRequestsWithAssignees(supabase, list);
  return list;
}

// IT Services API Service
export const itServicesApi = {
  // IT Request Categories
  categories: {
    getAll: async () => {
      try {
        let { data, error } = await supabase
          .from('it_request_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error?.message?.includes('is_active')) {
          const fallback = await supabase
            .from('it_request_categories')
            .select('*')
            .order('sort_order', { ascending: true });
          data = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;
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
          .neq('status', 'cancelled') // Exclude soft-deleted items
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
              assignee:assigned_to(id, full_name, email, role, department),
              requester:requester_id(
                full_name,
                email,
                department,
                role
              )
            `)
            .neq('status', 'cancelled') // Exclude soft-deleted items
            .order('created_at', { ascending: false });

          // Apply role-based filtering - non-IT users see only their own requests
          if (!canManageItRequestQueue(userRole)) {
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
          
          processedData = await finalizeItRequestRows(processedData);
          return { data: processedData };
        }

        if (error) throw error;

        // Exclude soft-deleted (cancelled) - in case view didn't filter
        let filteredData = (data || []).filter(request => request.status !== 'cancelled');
        // Apply role-based filtering for view data - non-IT users see only their own requests
        if (!canManageItRequestQueue(userRole)) {
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

        // If requester information is missing, fetch it separately (requester_id may be auth.uid or users/employees id)
        if (filteredData.length > 0 && (!filteredData[0].requester || !filteredData[0].requester.full_name)) {
          const requesterIds = [...new Set(filteredData.map(req => req.requester_id).filter(Boolean))];
          const requesterMap = {};

          try {
            // Try by id (employees / users primary key)
            const [byEmpId, byUserId] = await Promise.all([
              supabase.from('employees').select('id, auth_user_id, full_name, email, department, role').in('id', requesterIds),
              supabase.from('users').select('id, auth_user_id, full_name, email, department, role').in('id', requesterIds)
            ]);
            [byEmpId.data, byUserId.data].forEach((rows) => {
              if (rows) rows.forEach((row) => {
                requesterMap[row.id] = { full_name: row.full_name, email: row.email, department: row.department, role: row.role };
                if (row.auth_user_id) requesterMap[row.auth_user_id] = { full_name: row.full_name, email: row.email, department: row.department, role: row.role };
              });
            });

            // Try by auth_user_id (requester_id is often auth.uid from Supabase Auth)
            if (requesterIds.some((id) => !requesterMap[id])) {
              const [empByAuth, usersByAuth] = await Promise.all([
                supabase.from('employees').select('id, auth_user_id, full_name, email, department, role').in('auth_user_id', requesterIds),
                supabase.from('users').select('id, auth_user_id, full_name, email, department, role').in('auth_user_id', requesterIds)
              ]);
              [empByAuth.data, usersByAuth.data].forEach((rows) => {
                if (rows) rows.forEach((row) => {
                  if (row.auth_user_id) requesterMap[row.auth_user_id] = { full_name: row.full_name, email: row.email, department: row.department, role: row.role };
                  requesterMap[row.id] = { full_name: row.full_name, email: row.email, department: row.department, role: row.role };
                });
              });
            }

            filteredData = filteredData.map((request) => ({
              ...request,
              requester: requesterMap[request.requester_id] || {
                full_name: 'Unknown User',
                email: null,
                department: null,
                role: null
              }
            }));
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

        filteredData = await finalizeItRequestRows(filteredData);
        return { data: filteredData };
      } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        // Always use base table with joins so we get requester (view may not have nested requester)
        const { data, error } = await supabase
          .from('it_requests')
          .select(`
            *,
            category:category_id(name, description, icon, color),
            priority:priority_id(name, level, color, sla_hours, description),
            assignee:assigned_to(id, full_name, email, role, department),
            requester:requester_id(full_name, email, role, department)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return null;

        // If requester join returned empty (e.g. requester_id is auth.uid but users.id differs), resolve by auth_user_id
        if (data.requester_id && (!data.requester || !data.requester.full_name)) {
          const { data: u } = await supabase.from('users').select('full_name, email, department, role').eq('id', data.requester_id).single();
          if (u) data.requester = u;
          if (!data.requester) {
            const { data: u2 } = await supabase.from('users').select('full_name, email, department, role').eq('auth_user_id', data.requester_id).single();
            if (u2) data.requester = u2;
          }
        }
        if (data.assigned_to && (!data.assignee || !data.assignee.full_name)) {
          const [one] = await finalizeItRequestRows([data]);
          return one;
        }
        return data;
      } catch (error) {
        console.error('Error fetching request:', error);
        throw error;
      }
    },

    create: async (requestData) => {
      try {
        const requesterId = (await resolveItRequestRequesterId()) || requestData.requester_id || null;
        if (!requesterId) {
          throw new Error('You must be logged in to submit an IT request.');
        }
        const { data, error } = await supabase
          .from('it_requests')
          .insert({
            title: requestData.title,
            description: requestData.description,
            request_type: requestData.request_type || 'it_service',
            category_id: requestData.category_id,
            priority_id: requestData.priority_id,
            requester_id: requesterId,
            estimated_completion_date: requestData.estimated_completion_date || null,
            status: 'open'
          })
          .select()
          .single();

        if (error) throw error;

        // Notify the requester (the person who raised the ticket)
        // - In-app: broadcast to the user's notification channel (works without DB RPCs)
        // - In-app (optional): try notifications table RPC if it exists
        // - Email (optional): try Edge Function `send-email` via emailService (falls back to console logging if missing)
        try {
          const requesterId = data?.requester_id;
          if (requesterId) {
            // Broadcast notification (used by NotificationContext subscription)
            try {
              await supabase
                .channel(`user_${requesterId}_notifications`)
                .send({
                  type: 'broadcast',
                  event: 'notification',
                  payload: {
                    id: `it_request_created_${data.id}_${Date.now()}`,
                    type: 'it_request',
                    title: 'IT Request Submitted',
                    message: `Your IT request has been submitted: ${data.title}`,
                    priority: 'medium',
                    data: {
                      request_id: data.id,
                      request_title: data.title,
                      request_number: data.request_number,
                      status: data.status
                    },
                    timestamp: new Date(),
                    read: false
                  }
                });
            } catch (broadcastErr) {
              console.warn('⚠️ Failed to broadcast requester notification:', broadcastErr?.message || broadcastErr);
            }

            // Try DB-backed notification (if RPC exists)
            try {
              await notificationService.createNotification({
                userId: requesterId,
                type: 'it_request',
                title: 'IT Request Submitted',
                message: `Your IT request has been submitted: ${data.title}`,
                data: {
                  request_id: data.id,
                  request_title: data.title,
                  request_number: data.request_number,
                  status: data.status
                },
                priority: 'medium',
                actionUrl: `/it-requests?view=${data.id}`,
                actionLabel: 'View Request'
              });
            } catch (dbNotifErr) {
              console.warn('⚠️ Failed to create requester DB notification:', dbNotifErr?.message || dbNotifErr);
            }

            // Resolve requester email (users/employees id or auth_user_id) and attempt email
            try {
              const [uById, uByAuth, eById, eByAuth] = await Promise.all([
                supabase.from('users').select('email, full_name').eq('id', requesterId).maybeSingle(),
                supabase.from('users').select('email, full_name').eq('auth_user_id', requesterId).maybeSingle(),
                supabase.from('employees').select('email, full_name').eq('id', requesterId).maybeSingle(),
                supabase.from('employees').select('email, full_name').eq('auth_user_id', requesterId).maybeSingle()
              ]);

              const requester =
                uById.data || uByAuth.data || eById.data || eByAuth.data || null;

              if (requester?.email) {
                await emailService.sendRequestCreated(
                  { ...data, requester: { full_name: requester.full_name, email: requester.email } },
                  requester.email
                );
              } else {
                console.warn('⚠️ Request-created email skipped: requester email not found for requester_id', requesterId);
              }
            } catch (emailErr) {
              console.warn('⚠️ Failed to send requester request-created email:', emailErr?.message || emailErr);
            }
          }
        } catch (requesterNotifyErr) {
          console.warn('⚠️ Requester notification block failed:', requesterNotifyErr?.message || requesterNotifyErr);
        }

        // Notify IT staff UHub users (in-app + push + email)
        try {
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
        
        // Get current request data to check for status and assignment changes
        const { data: currentRequest, error: fetchError } = await supabase
          .from('it_requests')
          .select('status, assigned_to')
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
          setTimeout(async () => {
            try {
              await notificationService.notifyITRequestStatusUpdate(data, currentRequest.status, updateData.status);
              console.log('✅ IT Request status update notification sent successfully');
            } catch (notificationError) {
              console.error('⚠️ Failed to send IT request status update notification:', notificationError);
            }
          }, 0);
        }

        // Send assignment notification + email when assigned_to is set or changed
        const newAssignedTo = (updateData.assigned_to !== undefined && updateData.assigned_to !== '') ? updateData.assigned_to : null;
        const previousAssignedTo = currentRequest?.assigned_to ?? null;
        const assignedChanged = newAssignedTo && String(newAssignedTo) !== String(previousAssignedTo);
        if (assignedChanged) {
          setTimeout(async () => {
            try {
              await notificationService.sendITRequestAssignmentNotification(data);
              console.log('✅ Assignment notification (in-app + email) sent to assignee');
            } catch (e) {
              console.error('⚠️ Assignment notification failed:', e);
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

        // Send assignment notification + email when assignee is set
        if (assignedTo && data?.assigned_to) {
          setTimeout(() => notificationService.sendITRequestAssignmentNotification(data), 0);
        }
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

        // Send in-app + email notification to assignee (non-blocking)
        if (data?.assigned_to) {
          setTimeout(() => notificationService.sendITRequestAssignmentNotification(data), 0);
        }
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
      const updatePayload = (status) => ({
        status,
        updated_at: new Date().toISOString()
      });

      for (const tryStatus of ['cancelled', 'closed']) {
        try {
          const { data, error } = await supabase
            .from('it_requests')
            .update(updatePayload(tryStatus))
            .eq('id', id)
            .select()
            .single();

          if (error) {
            const isCheckConstraint = (error.message || '').includes('it_requests_status_check') || (error.message || '').includes('check constraint');
            if (isCheckConstraint && tryStatus === 'cancelled') continue;
            throw error;
          }
          if (!data) throw new Error('No rows were updated. The request may not exist or you may not have permission.');
          return data;
        } catch (err) {
          if (tryStatus === 'closed') throw err;
          const isCheckConstraint = (err.message || '').includes('it_requests_status_check') || (err.message || '').includes('check constraint');
          if (!isCheckConstraint) throw err;
        }
      }
      throw new Error('Failed to soft delete: status check constraint rejected both cancelled and closed.');
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
            .select('*')
            .neq('status', 'cancelled'); // Exclude soft-deleted items

          // Apply role-based filtering for statistics - non-IT users see only their own requests
          if (!canManageItRequestQueue(userRole)) {
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

        // Only exclude cancelled (soft-deleted) items if we're not specifically looking for that status
        if (status !== 'cancelled') {
          query = query.neq('status', 'cancelled');
        }

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

          // Only exclude cancelled (soft-deleted) items if we're not specifically looking for that status
          if (status !== 'cancelled') {
            query = query.neq('status', 'cancelled');
          }

          // Apply role-based filtering - non-IT users see only their own requests
          if (!canManageItRequestQueue(userRole)) {
            query = query.eq('requester_id', userId);
          }

          const { data: fallbackData, error: fallbackError } = await query;
          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }

        if (error) throw error;

        // Apply role-based filtering for view data - non-IT users see only their own requests
        let filteredData = data || [];
        if (!canManageItRequestQueue(userRole)) {
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

  // IT Assets
  assets: {
    getAll: async (filters = {}) => {
      try {
        let query = supabase
          .from('it_assets')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          query = query.or(`name.ilike.%${searchTerm}%,asset_tag.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { data: data || [] };
      } catch (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }
    },

    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('it_assets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching asset:', error);
        throw error;
      }
    },

    create: async (assetData) => {
      try {
        const { data, error } = await supabase
          .from('it_assets')
          .insert(assetData)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating asset:', error);
        throw error;
      }
    },

    update: async (id, assetData) => {
      try {
        const { data, error } = await supabase
          .from('it_assets')
          .update(assetData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating asset:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('it_assets')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting asset:', error);
        throw error;
      }
    },

    assign: async (assetId, employeeId, assignedBy) => {
      try {
        const { data, error } = await supabase
          .from('it_assets')
          .update({
            assigned_to: employeeId,
            assigned_by: assignedBy,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
          })
          .eq('id', assetId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error assigning asset:', error);
        throw error;
      }
    },

    return: async (assetId, returnedBy) => {
      try {
        const { data, error } = await supabase
          .from('it_assets')
          .update({
            assigned_to: null,
            assigned_by: null,
            assigned_at: null,
            returned_at: new Date().toISOString(),
            returned_by: returnedBy,
            status: 'available'
          })
          .eq('id', assetId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error returning asset:', error);
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
          .in('role', IT_STAFF_ROLES)
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
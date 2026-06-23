import { supabase } from '../supabaseClient';
import notificationService from './notificationService';
import { emailService } from './emailService';
import { resolveItRequestRequesterId, formatItRequestSubmitError } from './unifiedNotify';
import { shouldScopeItRequestsToOwn } from '../utils/notificationRoles';
import {
  normalizeItRequestList,
  enrichItRequestsWithAssignees,
} from '../utils/itRequestEnrichment';

// IT Services API Service - FIXED VERSION
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
    /**
     * @param {object} filters
     * @param {string | null} userId — auth uid of logged-in UHub user
     * @param {string | null} userRole
     * @param {{ scope?: 'mine' | 'queue' }} [options] — 'mine' = IT Requests page (own tickets; admin sees all)
     */
    getAll: async (filters = {}, userId = null, userRole = null, options = {}) => {
      try {
        const scope = options.scope || 'mine';
        console.log('Fetching requests with filters:', filters, 'userId:', userId, 'userRole:', userRole, 'scope:', scope);

        // Fetch requests with requester and category/priority for display; exclude soft-deleted (cancelled)
        let query = supabase
          .from('it_requests')
          .select(`
            *,
            requester:requester_id(full_name, email),
            assignee:assigned_to(id, full_name, email, role, department),
            category:category_id(name, icon, color),
            priority:priority_id(name, level, color, sla_hours)
          `)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false });

        // Requester portal: own tickets only (admin sees all). Queue scope is for Request Inbox via itServicesApi.js.
        if (shouldScopeItRequestsToOwn(scope, userRole) && userId) {
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
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('Requests fetch error:', error);
          throw error;
        }

        // Safety: exclude any cancelled that might slip through (e.g. view/RLS)
        const list = (data || []).filter((r) => r.status !== 'cancelled');
        let normalized = normalizeItRequestList(list);
        normalized = await enrichItRequestsWithAssignees(supabase, normalized);
        console.log('Fetched requests (excluding cancelled):', normalized.length);
        return normalized;
        
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
        const requesterId = await resolveItRequestRequesterId();
        if (!requesterId) {
          throw new Error('You must be logged in to submit an IT request. Please sign out and sign in again.');
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
            status: 'open'
          })
          .select()
          .single();

        if (error) {
          console.error('Request creation error:', error);
          throw new Error(formatItRequestSubmitError(error));
        }

        console.log('Request created successfully:', data);

        // Notify the requester (receipt/confirmation) + attempt request-created email
        try {
          const rid = data?.requester_id;
          if (rid) {
            // In-app broadcast (works even if DB RPCs are missing)
            try {
              await supabase
                .channel(`user_${rid}_notifications`)
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
              console.warn('Failed to broadcast requester IT request notification:', broadcastErr);
            }

            // DB-backed notification (optional; depends on `create_notification` RPC)
            try {
              await notificationService.createNotification({
                userId: rid,
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
            } catch (dbErr) {
              console.warn('Failed to create requester DB notification:', dbErr);
            }

            // Email (optional): resolve requester email from users/employees and invoke send-email Edge Function (if deployed)
            try {
              const [uById, uByAuth, eById, eByAuth] = await Promise.all([
                supabase.from('users').select('email, full_name').eq('id', rid).maybeSingle(),
                supabase.from('users').select('email, full_name').eq('auth_user_id', rid).maybeSingle(),
                supabase.from('employees').select('email, full_name').eq('id', rid).maybeSingle(),
                supabase.from('employees').select('email, full_name').eq('auth_user_id', rid).maybeSingle()
              ]);
              const requester = uById.data || uByAuth.data || eById.data || eByAuth.data || null;
              if (requester?.email) {
                await emailService.sendRequestCreated(
                  { ...data, requester: { full_name: requester.full_name, email: requester.email } },
                  requester.email
                );
              } else {
                console.warn('Request-created email skipped: requester email not found for requester_id', rid);
              }
            } catch (emailErr) {
              console.warn('Failed to send request-created email:', emailErr);
            }
          }
        } catch (requesterBlockErr) {
          console.warn('Requester notification block failed:', requesterBlockErr);
        }

        // Notify IT managers/admins that a ticket has been raised (in-app notifications)
        try {
          await notificationService.notifyITRequestCreated(data);
          console.log('IT request created notification sent');
        } catch (notificationError) {
          console.warn('Failed to send IT request notification:', notificationError);
        }
        return data;
      } catch (error) {
        console.error('Error creating request:', error);
        throw error;
      }
    },

    update: async (id, requestData) => {
      try {
        const previous = await supabase.from('it_requests').select('assigned_to').eq('id', id).single();
        const previousAssignedTo = previous.data?.assigned_to ?? null;

        const payload = {
          title: requestData.title,
          description: requestData.description,
          category_id: requestData.category_id,
          priority_id: requestData.priority_id,
          request_type: requestData.request_type,
          updated_at: new Date().toISOString()
        };
        // Only set assigned_to if provided (must be a valid user/employee id per DB FK)
        if (requestData.assigned_to !== undefined && requestData.assigned_to !== '') {
          payload.assigned_to = requestData.assigned_to || null;
          payload.assigned_at = requestData.assigned_to ? new Date().toISOString() : null;
          if (requestData.assigned_to) payload.status = 'assigned';
        }

        const { data, error } = await supabase
          .from('it_requests')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Request update error:', error);
          throw error;
        }

        const newAssignedTo = data?.assigned_to ?? null;
        if (newAssignedTo && newAssignedTo !== previousAssignedTo) {
          setTimeout(() => notificationService.sendITRequestAssignmentNotification(data), 0);
        }
        return data;
      } catch (error) {
        console.error('Error updating request:', error);
        throw error;
      }
    },

    // Requester confirms a resolved ticket and closes it → moves to Request Archive
    closeByRequester: async (id) => {
      try {
        const { data, error } = await supabase
          .from('it_requests')
          .update({
            status: 'closed',
            actual_completion_date: new Date().toISOString(),
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('status', 'resolved')
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error('Ticket could not be closed — it may not be in Resolved state, or you lack permission.');
        }

        // Tell IT staff/assignee the requester confirmed closure (non-blocking)
        setTimeout(() => {
          notificationService.notifyITRequestStatusUpdate(data, 'resolved', 'closed')
            .catch((e) => console.warn('Close-confirmation notification failed:', e));
        }, 0);

        return data;
      } catch (error) {
        console.error('Error closing ticket:', error);
        throw error;
      }
    },

    delete: async (id) => {
      const updatePayload = (status) => ({
        status,
        updated_at: new Date().toISOString()
      });

      // Prefer 'cancelled' for soft delete; fallback to 'closed' if DB constraint doesn't allow 'cancelled'
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
            if (isCheckConstraint && tryStatus === 'cancelled') continue; // retry with 'closed'
            throw error;
          }

          if (!data) {
            throw new Error('No rows were updated. The request may not exist or you may not have permission.');
          }
          return data;
        } catch (err) {
          if (tryStatus === 'closed') {
            console.error('Error soft deleting request:', err);
            throw err;
          }
          const isCheckConstraint = (err.message || '').includes('it_requests_status_check') || (err.message || '').includes('check constraint');
          if (!isCheckConstraint) throw err;
        }
      }
      throw new Error('Failed to soft delete: status check constraint rejected both cancelled and closed.');
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

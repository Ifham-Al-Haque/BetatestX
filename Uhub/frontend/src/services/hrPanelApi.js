import { supabase } from '../supabaseClient';

const HR_STAFF_ROLES = ['admin', 'hr_manager'];

export const hrPanelApi = {
  /** UHub users eligible for HR assignment (users table) */
  async getHRStaff() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, department, auth_user_id')
        .in('role', HR_STAFF_ROLES)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching HR staff:', error);
      return [];
    }
  },

  complaintComments: {
    async getByComplaintId(complaintId) {
      const { data, error } = await supabase
        .from('complaint_comments')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async create({ complaintId, userId, userName, comment, isInternal = false }) {
      const { data, error } = await supabase
        .from('complaint_comments')
        .insert({
          complaint_id: complaintId,
          user_id: userId,
          user_name: userName,
          comment: comment.trim(),
          is_internal: isInternal,
        })
        .select()
        .single();

      if (error) throw error;

      if (!isInternal) {
        try {
          const notificationService = (await import('./notificationService')).default;
          const { data: complaint } = await supabase
            .from('complaints')
            .select('id, title, complainant_id')
            .eq('id', complaintId)
            .single();

          if (complaint?.complainant_id) {
            await notificationService.createNotification({
              userId: complaint.complainant_id,
              type: 'complaint_update',
              title: 'HR Response on Your Complaint',
              message: `HR replied to "${complaint.title}"`,
              data: { complaint_id: complaintId, comment_id: data.id },
              actionUrl: '/complaints',
              actionLabel: 'View Complaint',
            });
          }
        } catch (notifyErr) {
          console.warn('Complaint comment notification failed:', notifyErr);
        }
      }

      return data;
    },
  },

  suggestionComments: {
    async getBySuggestionId(suggestionId) {
      const { data, error } = await supabase
        .from('suggestion_comments')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async create({ suggestionId, userId, userName, comment, isInternal = false }) {
      const { data, error } = await supabase
        .from('suggestion_comments')
        .insert({
          suggestion_id: suggestionId,
          user_id: userId,
          user_name: userName,
          comment: comment.trim(),
          is_internal: isInternal,
        })
        .select()
        .single();

      if (error) throw error;

      if (!isInternal) {
        try {
          const notificationService = (await import('./notificationService')).default;
          const { data: suggestion } = await supabase
            .from('suggestions')
            .select('id, title, suggester_id')
            .eq('id', suggestionId)
            .single();

          if (suggestion?.suggester_id) {
            await notificationService.createNotification({
              userId: suggestion.suggester_id,
              type: 'suggestion',
              title: 'HR Response on Your Suggestion',
              message: `HR replied to "${suggestion.title}"`,
              data: { suggestion_id: suggestionId, comment_id: data.id },
              actionUrl: '/suggestions',
              actionLabel: 'View Suggestion',
            });
          }
        } catch (notifyErr) {
          console.warn('Suggestion comment notification failed:', notifyErr);
        }
      }

      return data;
    },
  },
};

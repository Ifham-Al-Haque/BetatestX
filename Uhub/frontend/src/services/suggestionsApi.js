import { supabase } from '../supabaseClient';

export const suggestionsApi = {
  // Create a new suggestion
  async createSuggestion(suggestionData) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          title: suggestionData.title,
          description: suggestionData.description,
          category: suggestionData.category,
          priority: suggestionData.priority || 'medium',
          suggestion_type: suggestionData.suggestion_type || 'general',
          target_user_id: suggestionData.target_user_id || null,
          target_user_name: suggestionData.target_user_name || null,
          suggester_id: suggestionData.suggester_id,
          suggester_name: suggestionData.suggester_name,
          anonymous: suggestionData.anonymous || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send suggestion notifications (in-app + email)
      try {
        const notificationService = (await import('./notificationService')).default;
        await notificationService.notifySuggestionCreated(data);
        console.log('✅ Suggestion notification sent successfully');
      } catch (notificationError) {
        console.error('⚠️ Failed to send suggestion notification:', notificationError);
      }

      return data;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  },

  // Get all suggestions (with role-based filtering)
  async getSuggestions(userId, userRole) {
    try {
      let query = supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (userRole === 'employee') {
        // Employees can see their own suggestions, suggestions targeted at them, and general suggestions
        query = query.or(`suggester_id.eq.${userId},target_user_id.eq.${userId},suggestion_type.eq.general`);
      }
      // Admins, HR, and managers can see all suggestions

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  },

  // Get suggestions with filters
  async getSuggestionsWithFilters(filters, userId, userRole) {
    try {
      let query = supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply role-based filtering first
      if (userRole === 'employee') {
        query = query.or(`suggester_id.eq.${userId},target_user_id.eq.${userId},suggestion_type.eq.general`);
      }

      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.suggestion_type) {
        query = query.eq('suggestion_type', filters.suggestion_type);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suggestions with filters:', error);
      throw error;
    }
  },

  // Get suggestion by ID
  async getSuggestionById(suggestionId) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      throw error;
    }
  },

  // Update suggestion
  async updateSuggestion(suggestionId, updateData) {
    try {
      console.log('Updating suggestion:', suggestionId, 'with data:', updateData);
      
      // Clean up the update data to handle empty strings for UUID fields
      const cleanedUpdateData = {
        ...updateData,
        // Convert empty strings to null for UUID fields
        target_user_id: updateData.target_user_id && updateData.target_user_id.trim() !== '' 
          ? updateData.target_user_id 
          : null,
        // Ensure target_user_name is null if target_user_id is null
        target_user_name: updateData.target_user_id && updateData.target_user_id.trim() !== '' 
          ? updateData.target_user_name 
          : null
      };

      console.log('Cleaned update data:', cleanedUpdateData);
      
      // First check if the suggestion exists and user has permission
      const { data: existingSuggestion, error: fetchError } = await supabase
        .from('suggestions')
        .select('id, suggester_id, status')
        .eq('id', suggestionId)
        .single();

      if (fetchError) {
        console.error('Error fetching suggestion for update:', fetchError);
        throw new Error(`Suggestion not found: ${fetchError.message}`);
      }

      if (!existingSuggestion) {
        throw new Error('Suggestion not found');
      }

      console.log('Existing suggestion found:', existingSuggestion);

      const { data, error } = await supabase
        .from('suggestions')
        .update({
          ...cleanedUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to update suggestion: ${error.message}`);
      }

      console.log('Suggestion updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating suggestion:', error);
      throw error;
    }
  },

  // Update suggestion status
  async updateSuggestionStatus(suggestionId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating suggestion status:', error);
      throw error;
    }
  },

  // Delete suggestion
  async deleteSuggestion(suggestionId) {
    try {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      throw error;
    }
  },

  // Get suggestion categories
  async getSuggestionCategories() {
    try {
      const { data, error } = await supabase
        .from('suggestion_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suggestion categories:', error);
      throw error;
    }
  },

  // Get suggestion statistics
  async getSuggestionStatistics() {
    try {
      const { data, error } = await supabase
        .from('suggestion_statistics')
        .select('*')
        .single();

      if (error) throw error;
      return data || {};
    } catch (error) {
      console.error('Error fetching suggestion statistics:', error);
      throw error;
    }
  },

  // Upvote a suggestion
  async upvoteSuggestion(suggestionId) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .update({
          upvotes: supabase.raw('upvotes + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upvoting suggestion:', error);
      throw error;
    }
  },

  // Downvote a suggestion
  async downvoteSuggestion(suggestionId) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .update({
          downvotes: supabase.raw('downvotes + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error downvoting suggestion:', error);
      throw error;
    }
  },

  // HR inbox — all suggestions (RLS restricts to admin/hr_manager)
  async getAllSuggestionsForInbox(filters = {}) {
    try {
      let query = supabase
        .from('suggestions')
        .select(`
          *,
          assignee:assigned_to(id, full_name, email, department)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.suggestion_type) query = query.eq('suggestion_type', filters.suggestion_type);
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,suggester_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suggestions inbox:', error);
      throw error;
    }
  },

  // Get users for targeting suggestions
  async getUsersForTargeting() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, department, position')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users for targeting:', error);
      throw error;
    }
  },

  /** Assign suggestion to a UHub user (users.id) */
  async assignSuggestionToUser(suggestionId, userId, userName) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .update({
          assigned_to: userId || null,
          assigned_to_name: userName || null,
          assigned_at: userId ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select(`
          *,
          assignee:assigned_to(id, full_name, email, department)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning suggestion to user:', error);
      throw error;
    }
  },
};

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
      const { data, error } = await supabase
        .from('suggestions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
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
  }
};

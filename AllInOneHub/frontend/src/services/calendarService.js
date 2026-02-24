import { supabase } from '../supabaseClient';

export const calendarService = {
  // Create a new event
  async createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.start_date,
          end_date: eventData.end_date,
          type: eventData.type,
          priority: eventData.priority,
          location: eventData.location,
          category: eventData.category,
          status: eventData.status || 'upcoming',
          user_id: eventData.user_id,
          department: eventData.department,
          attendees: eventData.attendees || [],
          is_all_day: eventData.is_all_day || false,
          recurrence: eventData.recurrence || null,
          reminder_time: eventData.reminder_time || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Get all events for a user
  async getUserEvents(userId, filters = {}) {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user events:', error);
      throw error;
    }
  },

  // Get all events (for admin or team view)
  async getAllEvents(filters = {}) {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.department && filters.department !== 'all') {
        query = query.eq('department', filters.department);
      }
      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  },

  // Update an event
  async updateEvent(eventId, updateData) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete an event
  async deleteEvent(eventId) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Get event by ID
  async getEventById(eventId) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Get upcoming events for a user
  async getUpcomingEvents(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  // Get events for a specific date range
  async getEventsByDateRange(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching events by date range:', error);
      throw error;
    }
  },

  // Search events
  async searchEvents(userId, searchTerm) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },

  // Get event statistics
  async getEventStats(userId) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('type, priority, status');

      if (error) throw error;

      const stats = {
        total: data.length,
        byType: {},
        byPriority: {},
        byStatus: {}
      };

      data.forEach(event => {
        // Count by type
        stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
        // Count by priority
        stats.byPriority[event.priority] = (stats.byPriority[event.priority] || 0) + 1;
        // Count by status
        stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  }
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseService = {
  // Store imported CSV data
  async storeImportedData(data, fileName, userId) {
    try {
      const { data: result, error } = await supabase
        .from('cspa_imports')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_size: data.rawData?.length || 0,
          data_type: data.dataType || 'unknown',
          processed_data: data.processedData,
          analytics: data.analytics,
          summary: data.summary,
          import_date: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error storing imported data:', error);
      throw error;
    }
  },

  // Get all imports for a user
  async getUserImports(userId) {
    try {
      const { data, error } = await supabase
        .from('cspa_imports')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('import_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user imports:', error);
      throw error;
    }
  },

  // Get specific import by ID
  async getImportById(importId) {
    try {
      const { data, error } = await supabase
        .from('cspa_imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching import:', error);
      throw error;
    }
  },

  // Update import status
  async updateImportStatus(importId, status) {
    try {
      const { data, error } = await supabase
        .from('cspa_imports')
        .update({ status })
        .eq('id', importId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating import status:', error);
      throw error;
    }
  },

  // Delete import
  async deleteImport(importId) {
    try {
      const { error } = await supabase
        .from('cspa_imports')
        .delete()
        .eq('id', importId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting import:', error);
      throw error;
    }
  },

  // Store call analytics data separately for better performance
  async storeCallAnalytics(importId, analytics) {
    try {
      const { data, error } = await supabase
        .from('cspa_call_analytics')
        .insert({
          import_id: importId,
          direction_distribution: analytics.directionDistribution,
          call_result_distribution: analytics.callResultDistribution,
          agent_distribution: analytics.agentDistribution,
          queue_distribution: analytics.queueDistribution,
          avg_talk_time: analytics.avgTalkTime,
          avg_time_in_queue: analytics.avgTimeInQueue,
          avg_on_hold_duration: analytics.avgOnHoldDuration,
          total_calls: analytics.totalCalls,
          inbound_calls: analytics.inboundCalls,
          outbound_calls: analytics.outboundCalls,
          abandoned_calls: analytics.abandonedCalls,
          lost_in_ivr_calls: analytics.lostInIVRCalls,
          avg_survey_rating: analytics.avgSurveyRating,
          repeat_call_rate: analytics.repeatCallRate,
          agent_performance: analytics.agentPerformance,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing call analytics:', error);
      throw error;
    }
  },

  // Get call analytics for an import
  async getCallAnalytics(importId) {
    try {
      const { data, error } = await supabase
        .from('cspa_call_analytics')
        .select('*')
        .eq('import_id', importId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching call analytics:', error);
      throw error;
    }
  },

  // Search and filter imports
  async searchImports(userId, searchTerm, dataType, dateRange) {
    try {
      let query = supabase
        .from('cspa_imports')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (searchTerm) {
        query = query.ilike('file_name', `%${searchTerm}%`);
      }

      if (dataType && dataType !== 'all') {
        query = query.eq('data_type', dataType);
      }

      if (dateRange?.start) {
        query = query.gte('import_date', dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte('import_date', dateRange.end);
      }

      const { data, error } = await query.order('import_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching imports:', error);
      throw error;
    }
  }
};

export default supabaseService;

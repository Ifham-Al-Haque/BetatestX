import { supabase } from '../supabaseClient';

class LTRReportingService {
  // Get all LTR reporting records with optional filters
  async getLTRRecords(filters = {}) {
    try {
      let query = supabase
        .from('ltr_reporting')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.customer_id) {
        query = query.ilike('customer_id', `%${filters.customer_id}%`);
      }
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      if (filters.plate_reservation) {
        query = query.ilike('plate_reservation', `%${filters.plate_reservation}%`);
      }
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }
      if (filters.period) {
        query = query.ilike('period', `%${filters.period}%`);
      }
      if (filters.search) {
        query = query.or(
          `customer_id.ilike.%${filters.search}%,name.ilike.%${filters.search}%,plate_reservation.ilike.%${filters.search}%,title.ilike.%${filters.search}%,period.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching LTR reporting records:', error);
      throw error;
    }
  }

  // Get single LTR reporting record by ID
  async getLTRRecord(id) {
    try {
      const { data, error } = await supabase
        .from('ltr_reporting')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching LTR reporting record:', error);
      throw error;
    }
  }

  // Create new LTR reporting record
  async createLTRRecord(recordData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ltr_reporting')
        .insert([{
          ...recordData,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating LTR reporting record:', error);
      throw error;
    }
  }

  // Update LTR reporting record
  async updateLTRRecord(id, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('ltr_reporting')
        .update({
          ...updates,
          updated_by: user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating LTR reporting record:', error);
      throw error;
    }
  }

  // Delete LTR reporting record
  async deleteLTRRecord(id) {
    try {
      const { error } = await supabase
        .from('ltr_reporting')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting LTR reporting record:', error);
      throw error;
    }
  }

  // Bulk insert LTR reporting records (for CSV/Excel import)
  async bulkInsertLTRRecords(records) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const recordsWithMetadata = records.map(record => ({
        ...record,
        created_by: user?.id,
        updated_by: user?.id
      }));

      const { data, error } = await supabase
        .from('ltr_reporting')
        .insert(recordsWithMetadata)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk inserting LTR reporting records:', error);
      throw error;
    }
  }
}

const ltrReportingService = new LTRReportingService();
export default ltrReportingService;


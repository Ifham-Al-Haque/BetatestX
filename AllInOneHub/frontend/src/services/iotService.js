import { supabase } from '../supabaseClient';

class IOTService {
  // Get all IOT records with optional filters
  async getIOTRecords(filters = {}) {
    try {
      let query = supabase
        .from('iot_records')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.vehicle_id) {
        query = query.ilike('vehicle_id', `%${filters.vehicle_id}%`);
      }
      if (filters.hardware_id) {
        query = query.ilike('hardware_id', `%${filters.hardware_id}%`);
      }
      if (filters.sim_number) {
        query = query.ilike('sim_number', `%${filters.sim_number}%`);
      }
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }
      if (filters.search) {
        query = query.or(
          `vehicle_id.ilike.%${filters.search}%,hardware_id.ilike.%${filters.search}%,title.ilike.%${filters.search}%,sim_number.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching IOT records:', error);
      throw error;
    }
  }

  // Get single IOT record by ID
  async getIOTRecord(id) {
    try {
      const { data, error } = await supabase
        .from('iot_records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching IOT record:', error);
      throw error;
    }
  }

  // Create new IOT record
  async createIOTRecord(recordData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('iot_records')
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
      console.error('Error creating IOT record:', error);
      throw error;
    }
  }

  // Update IOT record
  async updateIOTRecord(id, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('iot_records')
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
      console.error('Error updating IOT record:', error);
      throw error;
    }
  }

  // Delete IOT record
  async deleteIOTRecord(id) {
    try {
      const { error } = await supabase
        .from('iot_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting IOT record:', error);
      throw error;
    }
  }

  // Bulk insert IOT records (for CSV import)
  async bulkInsertIOTRecords(records) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const recordsWithMetadata = records.map(record => ({
        ...record,
        created_by: user?.id,
        updated_by: user?.id
      }));

      const { data, error } = await supabase
        .from('iot_records')
        .insert(recordsWithMetadata)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk inserting IOT records:', error);
      throw error;
    }
  }
}

const iotService = new IOTService();
export default iotService;


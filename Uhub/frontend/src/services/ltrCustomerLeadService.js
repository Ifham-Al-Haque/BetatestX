import { supabase } from '../supabaseClient';

/**
 * Service for LTR Customer Lead records (Date, Current Trip, Trip Ended, New Trip, Renew Trip).
 * Data is persisted in Supabase table ltr_customer_lead.
 */
class LTRCustomerLeadService {
  async getRecords() {
    try {
      const { data, error } = await supabase
        .from('ltr_customer_lead')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching LTR customer lead records:', error);
      throw error;
    }
  }

  async createRecord(record) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        date: record.date || null,
        current_trip: Number(record.current_trip) || 0,
        trip_ended: Number(record.trip_ended) || 0,
        new_trip: Number(record.new_trip) || 0,
        renew_trip: Number(record.renew_trip) || 0,
        created_by: user?.id,
        updated_by: user?.id
      };
      const { data, error } = await supabase
        .from('ltr_customer_lead')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating LTR customer lead record:', error);
      throw error;
    }
  }

  async updateRecord(id, record) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        date: record.date || null,
        current_trip: Number(record.current_trip) || 0,
        trip_ended: Number(record.trip_ended) || 0,
        new_trip: Number(record.new_trip) || 0,
        renew_trip: Number(record.renew_trip) || 0,
        updated_by: user?.id
      };
      const { data, error } = await supabase
        .from('ltr_customer_lead')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating LTR customer lead record:', error);
      throw error;
    }
  }

  async deleteRecord(id) {
    try {
      const { error } = await supabase
        .from('ltr_customer_lead')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting LTR customer lead record:', error);
      throw error;
    }
  }

  async bulkInsert(records) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = records.map(r => ({
        date: r.date || null,
        current_trip: Number(r.current_trip) || 0,
        trip_ended: Number(r.trip_ended) || 0,
        new_trip: Number(r.new_trip) || 0,
        renew_trip: Number(r.renew_trip) || 0,
        created_by: user?.id,
        updated_by: user?.id
      }));

      const { data, error } = await supabase
        .from('ltr_customer_lead')
        .insert(rows)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk inserting LTR customer lead records:', error);
      throw error;
    }
  }
}

const ltrCustomerLeadService = new LTRCustomerLeadService();
export default ltrCustomerLeadService;

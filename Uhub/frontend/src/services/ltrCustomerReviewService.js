import { supabase } from '../supabaseClient';

/**
 * Service for LTR Customer Review records (Subscribe Now Panel).
 * Params: customer_name, rental_duration, rental_renew, rental_no_longer_continue, remark.
 * Data is persisted in Supabase table ltr_customer_review.
 */
class LTRCustomerReviewService {
  async getRecords() {
    try {
      const { data, error } = await supabase
        .from('ltr_customer_review')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching ltr_customer_review records:', error);
      throw error;
    }
  }

  async createRecord(record) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const payload = {
        customer_name: record.customer_name?.trim() || null,
        rental_duration: record.rental_duration?.trim() || null,
        rental_renew: Number(record.rental_renew) || 0,
        rental_no_longer_continue: Number(record.rental_no_longer_continue) || 0,
        remark: record.remark?.trim() || null,
        created_by: authUser?.id,
        updated_by: authUser?.id
      };
      const { data, error } = await supabase
        .from('ltr_customer_review')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ltr_customer_review record:', error);
      throw error;
    }
  }

  async updateRecord(id, record) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const payload = {
        customer_name: record.customer_name?.trim() || null,
        rental_duration: record.rental_duration?.trim() || null,
        rental_renew: Number(record.rental_renew) || 0,
        rental_no_longer_continue: Number(record.rental_no_longer_continue) || 0,
        remark: record.remark?.trim() || null,
        updated_by: authUser?.id
      };
      const { data, error } = await supabase
        .from('ltr_customer_review')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating ltr_customer_review record:', error);
      throw error;
    }
  }

  async deleteRecord(id) {
    try {
      const { error } = await supabase
        .from('ltr_customer_review')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting ltr_customer_review record:', error);
      throw error;
    }
  }

  async bulkInsert(records) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const rows = (records || []).map(r => ({
        customer_name: (r.customer_name || '').trim() || null,
        rental_duration: (r.rental_duration || '').trim() || null,
        rental_renew: Number(r.rental_renew) || 0,
        rental_no_longer_continue: Number(r.rental_no_longer_continue) || 0,
        remark: (r.remark || '').trim() || null,
        created_by: authUser?.id,
        updated_by: authUser?.id
      }));

      const { data, error } = await supabase
        .from('ltr_customer_review')
        .insert(rows)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk inserting ltr_customer_review records:', error);
      throw error;
    }
  }
}

const ltrCustomerReviewService = new LTRCustomerReviewService();
export default ltrCustomerReviewService;

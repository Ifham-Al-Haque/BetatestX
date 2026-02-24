import { supabase } from '../supabaseClient';

/**
 * Service for UDRIVE ACCESS records (IT Services Panel).
 * Params: access_platform_name, platform_purpose, department_uses, infrastructure_level,
 * original_amount, amount_in_aed, remark.
 * Data is persisted in Supabase table udrive_access.
 */
class UdriveAccessService {
  async getRecords() {
    try {
      const { data, error } = await supabase
        .from('udrive_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching udrive_access records:', error);
      throw error;
    }
  }

  async createRecord(record) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const payload = {
        access_platform_name: record.access_platform_name?.trim() || null,
        platform_purpose: record.platform_purpose?.trim() || null,
        department_uses: record.department_uses?.trim() || null,
        infrastructure_level: record.infrastructure_level?.trim() || null,
        original_amount: record.original_amount != null && record.original_amount !== '' ? Number(record.original_amount) : null,
        amount_in_aed: record.amount_in_aed != null && record.amount_in_aed !== '' ? Number(record.amount_in_aed) : null,
        remark: record.remark?.trim() || null,
        created_by: authUser?.id,
        updated_by: authUser?.id
      };
      const { data, error } = await supabase
        .from('udrive_access')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating udrive_access record:', error);
      throw error;
    }
  }

  async updateRecord(id, record) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const payload = {
        access_platform_name: record.access_platform_name?.trim() || null,
        platform_purpose: record.platform_purpose?.trim() || null,
        department_uses: record.department_uses?.trim() || null,
        infrastructure_level: record.infrastructure_level?.trim() || null,
        original_amount: record.original_amount != null && record.original_amount !== '' ? Number(record.original_amount) : null,
        amount_in_aed: record.amount_in_aed != null && record.amount_in_aed !== '' ? Number(record.amount_in_aed) : null,
        remark: record.remark?.trim() || null,
        updated_by: authUser?.id
      };
      const { data, error } = await supabase
        .from('udrive_access')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating udrive_access record:', error);
      throw error;
    }
  }

  async deleteRecord(id) {
    try {
      const { error } = await supabase
        .from('udrive_access')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting udrive_access record:', error);
      throw error;
    }
  }
}

const udriveAccessService = new UdriveAccessService();
export default udriveAccessService;

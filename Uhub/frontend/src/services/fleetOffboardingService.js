/**
 * Fleet Offboarding – real API (replaces mock).
 * Requires tables: fleet_offboarding_records, fleet_offboarding_checklist_items
 * Run supabase/migrations/20250303_fleet_offboarding_pm.sql if not already applied.
 */
import { supabase } from '../supabaseClient';

const DEFAULT_CHECKLIST_ITEMS = [
  { item_key: 'driver_return_vehicle', title: 'Driver Return Vehicle', sort_order: 1 },
  { item_key: 'remove_gps_tracking', title: 'Remove GPS Tracking', sort_order: 2 },
  { item_key: 'insurance_cancellation', title: 'Insurance Cancellation', sort_order: 3 },
  { item_key: 'final_inspection', title: 'Final Inspection', sort_order: 4 },
  { item_key: 'documentation_update', title: 'Documentation Update', sort_order: 5 },
];

export const OFFBOARDING_REASONS = [
  { value: 'total_loss', label: 'Total Loss' },
  { value: 'lease_contract_expired', label: 'Lease Contract Expired' },
  { value: 'end_of_service', label: 'End of Service' },
  { value: 'vehicle_replacement', label: 'Vehicle Replacement' },
  { value: 'sold', label: 'Sold' },
  { value: 'damage', label: 'Vehicle Damage' },
  { value: 'upgrade', label: 'Fleet Upgrade' },
  { value: 'other', label: 'Other' },
];

class FleetOffboardingService {
  async getRecords(filters = {}) {
    try {
      let query = supabase
        .from('fleet_offboarding_records')
        .select('*')
        .order('offboarding_date', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.date_from) query = query.gte('offboarding_date', filters.date_from);
      if (filters.date_to) query = query.lte('offboarding_date', filters.date_to);
      if (filters.search) {
        const { data: vehicles } = await supabase
          .from('fleet_vehicles')
          .select('id')
          .or(`vehicle_number.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
        const ids = (vehicles || []).map((v) => v.id);
        if (ids.length) query = query.in('vehicle_id', ids);
        else return [];
      }

      const { data: records, error } = await query;
      if (error) throw error;
      if (!records || records.length === 0) return [];

      const vehicleIds = [...new Set(records.map((r) => r.vehicle_id))];
      const { data: vehicles } = await supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, make, model, license_plate, status, last_service_date, assigned_driver_id')
        .in('id', vehicleIds);
      const vehicleMap = {};
      (vehicles || []).forEach((v) => { vehicleMap[v.id] = v; });

      const withChecklist = await Promise.all(
        records.map(async (record) => {
          const { data: items } = await supabase
            .from('fleet_offboarding_checklist_items')
            .select('*')
            .eq('offboarding_record_id', record.id)
            .order('sort_order');
          const completed = (items || []).filter((i) => i.completed).length;
          const total = (items || []).length;
          const progress_percentage = total ? Math.round((completed / total) * 100) : record.progress_percentage;
          if (progress_percentage !== record.progress_percentage && record.status !== 'completed') {
            await supabase
              .from('fleet_offboarding_records')
              .update({ progress_percentage, updated_at: new Date().toISOString() })
              .eq('id', record.id);
          }
          const v = vehicleMap[record.vehicle_id];
          return {
            ...record,
            checklist_items: items || [],
            progress_percentage,
            vehicle_number: v?.vehicle_number,
            make: v?.make,
            model: v?.model,
            last_service_date: v?.last_service_date,
            assigned_driver: '—', // optional: resolve from employees by v?.assigned_driver_id
          };
        })
      );
      return withChecklist;
    } catch (err) {
      if (err.code === '42P01') return []; // table does not exist
      console.error('Fleet offboarding getRecords:', err);
      throw err;
    }
  }

  async getRecordById(id) {
    try {
      const { data: record, error } = await supabase
        .from('fleet_offboarding_records')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const { data: items } = await supabase
        .from('fleet_offboarding_checklist_items')
        .select('*')
        .eq('offboarding_record_id', id)
        .order('sort_order');
      let v = null;
      if (record.vehicle_id) {
        const res = await supabase.from('fleet_vehicles').select('id, vehicle_number, make, model, license_plate, status, last_service_date').eq('id', record.vehicle_id).single();
        v = res.data;
      }
      return {
        ...record,
        checklist_items: items || [],
        vehicle_number: v?.vehicle_number,
        make: v?.make,
        model: v?.model,
        last_service_date: v?.last_service_date,
      };
    } catch (err) {
      if (err.code === '42P01' || err.code === 'PGRST116') return null;
      console.error('Fleet offboarding getRecordById:', err);
      throw err;
    }
  }

  /** Latest offboarding record for a given fleet vehicle (or null). */
  async getRecordByVehicleId(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_offboarding_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('offboarding_date', { ascending: false })
        .limit(1);
      if (error) throw error;
      const record = (data || [])[0];
      if (!record) return null;
      const { data: items } = await supabase
        .from('fleet_offboarding_checklist_items')
        .select('*')
        .eq('offboarding_record_id', record.id)
        .order('sort_order');
      return { ...record, checklist_items: items || [] };
    } catch (err) {
      if (err.code === '42P01' || err.code === 'PGRST116') return null;
      console.error('Fleet offboarding getRecordByVehicleId:', err);
      return null;
    }
  }

  async startOffboarding({ vehicle_id, reason, offboarding_date, notes, started_by }) {
    try {
      const { data: record, error } = await supabase
        .from('fleet_offboarding_records')
        .insert({
          vehicle_id,
          reason,
          offboarding_date: offboarding_date || new Date().toISOString().split('T')[0],
          status: 'in_progress',
          progress_percentage: 0,
          notes,
          started_by,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      for (const item of DEFAULT_CHECKLIST_ITEMS) {
        await supabase.from('fleet_offboarding_checklist_items').insert({
          offboarding_record_id: record.id,
          item_key: item.item_key,
          title: item.title,
          sort_order: item.sort_order,
        });
      }
      return this.getRecordById(record.id);
    } catch (err) {
      console.error('Fleet offboarding startOffboarding:', err);
      throw err;
    }
  }

  async updateChecklistItem(itemId, { completed, completed_by, completed_at }) {
    try {
      const { data, error } = await supabase
        .from('fleet_offboarding_checklist_items')
        .update({
          completed: !!completed,
          completed_by: completed ? completed_by : null,
          completed_at: completed ? (completed_at || new Date().toISOString()) : null,
        })
        .eq('id', itemId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Fleet offboarding updateChecklistItem:', err);
      throw err;
    }
  }

  async updateRecord(id, updates) {
    try {
      const { data, error } = await supabase
        .from('fleet_offboarding_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Fleet offboarding updateRecord:', err);
      throw err;
    }
  }

  async completeOffboarding(id) {
    try {
      const { data, error } = await supabase
        .from('fleet_offboarding_records')
        .update({
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Retire the fleet record (kept visible with an Offboarded badge)
      if (data?.vehicle_id) {
        await supabase
          .from('fleet_vehicles')
          .update({ status: 'Retired', updated_at: new Date().toISOString() })
          .eq('id', data.vehicle_id);
      }
      return data;
    } catch (err) {
      console.error('Fleet offboarding completeOffboarding:', err);
      throw err;
    }
  }

  async getStatistics() {
    try {
      const { data, error } = await supabase.from('fleet_offboarding_records').select('status');
      if (error) throw error;
      const list = data || [];
      return {
        total: list.length,
        completed: list.filter((r) => r.status === 'completed').length,
        in_progress: list.filter((r) => r.status === 'in_progress').length,
        not_started: list.filter((r) => r.status === 'not_started').length,
        on_hold: list.filter((r) => r.status === 'on_hold').length,
      };
    } catch (err) {
      if (err.code === '42P01') return { total: 0, completed: 0, in_progress: 0, not_started: 0, on_hold: 0 };
      throw err;
    }
  }
}

export const fleetOffboardingService = new FleetOffboardingService();
export default fleetOffboardingService;

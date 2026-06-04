/**
 * Fleet PM (Preventive Maintenance) scheduling.
 * Requires tables: fleet_pm_templates, fleet_pm_schedules (see supabase/migrations/20250303_fleet_offboarding_pm.sql)
 */
import { supabase } from '../supabaseClient';
import fleetService from './fleetService';

class FleetPmService {
  async getTemplates() {
    try {
      const { data, error } = await supabase
        .from('fleet_pm_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    } catch (err) {
      if (err.code === '42P01') return [];
      console.error('Fleet PM getTemplates:', err);
      throw err;
    }
  }

  async createTemplate({ name, description, maintenance_type, interval_km, interval_days }) {
    const { data, error } = await supabase
      .from('fleet_pm_templates')
      .insert({ name, description, maintenance_type, interval_km, interval_days })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getSchedules(filters = {}) {
    try {
      let query = supabase
        .from('fleet_pm_schedules')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (filters.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
      if (filters.due_before) query = query.lte('next_due_date', filters.due_before);

      const { data, error } = await query;
      if (error) throw error;
      const list = data || [];
      if (list.length === 0) return [];
      const vehicleIds = [...new Set(list.map((s) => s.vehicle_id))];
      const templateIds = [...new Set(list.map((s) => s.template_id))];
      const [vRes, tRes] = await Promise.all([
        supabase.from('fleet_vehicles').select('id, vehicle_number, make, model, license_plate, mileage, next_service_date').in('id', vehicleIds),
        supabase.from('fleet_pm_templates').select('id, name, maintenance_type, interval_km, interval_days').in('id', templateIds),
      ]);
      const vMap = {}; (vRes.data || []).forEach((v) => { vMap[v.id] = v; });
      const tMap = {}; (tRes.data || []).forEach((t) => { tMap[t.id] = t; });
      return list.map((s) => ({ ...s, fleet_vehicles: vMap[s.vehicle_id], fleet_pm_templates: tMap[s.template_id] }));
    } catch (err) {
      if (err.code === '42P01') return [];
      console.error('Fleet PM getSchedules:', err);
      throw err;
    }
  }

  async getDueSoon(daysAhead = 30) {
    const end = new Date();
    end.setDate(end.getDate() + daysAhead);
    return this.getSchedules({ due_before: end.toISOString().split('T')[0] });
  }

  async assignTemplateToVehicle(vehicleId, templateId, nextDueDate = null, nextDueMileage = null) {
    const { data, error } = await supabase
      .from('fleet_pm_schedules')
      .upsert(
        {
          vehicle_id: vehicleId,
          template_id: templateId,
          next_due_date: nextDueDate,
          next_due_mileage: nextDueMileage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'vehicle_id,template_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async markCompleted(scheduleId, completedMileage = null) {
    const { data: schedule, error: fetchErr } = await supabase
      .from('fleet_pm_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();
    if (fetchErr) throw fetchErr;
    let template = null;
    if (schedule.template_id) {
      const t = await supabase.from('fleet_pm_templates').select('interval_km, interval_days').eq('id', schedule.template_id).single();
      template = t.data;
    }

    const now = new Date().toISOString();
    const nextDueMileage = template?.interval_km
      ? (completedMileage ?? schedule.last_completed_mileage ?? 0) + template.interval_km
      : null;
    let nextDueDate = null;
    if (template?.interval_days) {
      const d = new Date();
      d.setDate(d.getDate() + template.interval_days);
      nextDueDate = d.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('fleet_pm_schedules')
      .update({
        last_completed_at: now,
        last_completed_mileage: completedMileage ?? schedule.last_completed_mileage,
        next_due_date: nextDueDate || schedule.next_due_date,
        next_due_mileage: nextDueMileage ?? schedule.next_due_mileage,
        updated_at: now,
      })
      .eq('id', scheduleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSchedule(scheduleId) {
    const { error } = await supabase
      .from('fleet_pm_schedules')
      .delete()
      .eq('id', scheduleId);
    if (error) throw error;
    return true;
  }

  async deleteTemplate(templateId) {
    const { error } = await supabase
      .from('fleet_pm_templates')
      .update({ is_active: false })
      .eq('id', templateId);
    if (error) throw error;
    return true;
  }

  /** Create a maintenance ticket for a due PM (so it shows in work orders) */
  async createTicketForDueSchedule(schedule) {
    const vehicle = schedule.fleet_vehicles;
    const template = schedule.fleet_pm_templates;
    if (!vehicle || !template) return null;
    return fleetService.createMaintenanceTicket({
      vehicle_id: schedule.vehicle_id,
      title: `PM: ${template.name}`,
      description: `Preventive maintenance due – ${template.name}`,
      maintenance_type: template.maintenance_type || 'Preventive',
      priority: 'High',
      status: 'Open',
      mileage_at_request: vehicle.mileage,
    });
  }
}

export const fleetPmService = new FleetPmService();
export default fleetPmService;

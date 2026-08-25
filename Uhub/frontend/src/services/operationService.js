import { supabase } from '../supabaseClient';

class OperationService {
  async getOverviewStats() {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEnd = monthEndDate.toISOString().slice(0, 10);

    const results = await Promise.allSettled([
      supabase.from('fleet_vehicles').select('id, status', { count: 'exact', head: false }),
      supabase
        .from('fleet_vehicles')
        .select('id', { count: 'exact', head: true })
        .gte('registration_expiry', monthStart)
        .lte('registration_expiry', monthEnd),
      supabase
        .from('fleet_incidents')
        .select('id', { count: 'exact', head: true })
        .eq('incident_type', 'Breakdown')
        .in('status', ['Open', 'Under Investigation']),
      supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('fleet_maintenance_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Open'),
    ]);

    const vehicles = results[0].status === 'fulfilled' ? results[0].value.data || [] : [];
    const maintenanceCount = vehicles.filter((v) => v.status === 'Maintenance').length;

    return {
      totalVehicles: vehicles.length,
      maintenanceVehicles: maintenanceCount,
      mulkiyaExpiringThisMonth: results[1].status === 'fulfilled' ? results[1].value.count || 0 : 0,
      activeBreakdowns: results[2].status === 'fulfilled' ? results[2].value.count || 0 : 0,
      activeDrivers: results[3].status === 'fulfilled' ? results[3].value.count || 0 : 0,
      openTickets: results[4].status === 'fulfilled' ? results[4].value.count || 0 : 0,
    };
  }

  async getBreakdownIncidents() {
    const { data, error } = await supabase
      .from('fleet_incidents')
      .select(
        `*,
        fleet_vehicles (
          id, vehicle_number, make, model, license_plate, car_name, fleet_image_url
        )`
      )
      .eq('incident_type', 'Breakdown')
      .order('incident_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createBreakdown(incidentData) {
    const { data, error } = await supabase
      .from('fleet_incidents')
      .insert([{ ...incidentData, incident_type: 'Breakdown' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getTeams() {
    const { data, error } = await supabase
      .from('operation_teams')
      .select(
        `*,
        operation_team_members (
          id, driver_id, role, is_active, member_status, display_order,
          drivers ( id, full_name, designation, team_type, status )
        )`
      )
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
      throw error;
    }
    return data || [];
  }

  async createTeam({ name, team_type, notes, shift_label, week_off, area, color, display_order }) {
    const { data, error } = await supabase
      .from('operation_teams')
      .insert([
        {
          name,
          team_type: team_type || null,
          notes: notes || null,
          shift_label: shift_label || null,
          week_off: week_off || null,
          area: area || null,
          color: color || 'blue',
          display_order: display_order ?? 0,
          status: 'active',
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateTeam(teamId, fields) {
    const { data, error } = await supabase
      .from('operation_teams')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTeam(teamId) {
    const { error } = await supabase.from('operation_teams').delete().eq('id', teamId);
    if (error) throw error;
    return true;
  }

  // Drivers available for allocation (the pool source)
  async getAllocatableDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name, designation, team_type, status')
      .order('full_name', { ascending: true });
    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }
    return data || [];
  }

  async addTeamMember(teamId, driverId, role = 'member') {
    const { data, error } = await supabase
      .from('operation_team_members')
      .insert([{ team_id: teamId, driver_id: driverId, role }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Place a driver onto a team. If the driver already has an active membership
  // (one team per driver on the board), move that row instead of inserting.
  async moveDriverToTeam(driverId, teamId, displayOrder = 0) {
    const { data: existing, error: findErr } = await supabase
      .from('operation_team_members')
      .select('id')
      .eq('driver_id', driverId)
      .eq('is_active', true)
      .maybeSingle();
    if (findErr && findErr.code !== 'PGRST116') throw findErr;

    if (existing?.id) {
      const { data, error } = await supabase
        .from('operation_team_members')
        .update({ team_id: teamId, display_order: displayOrder })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('operation_team_members')
      .insert([{ team_id: teamId, driver_id: driverId, role: 'member', member_status: 'active', display_order: displayOrder }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Remove a member from the board (returns the driver to the pool)
  async removeTeamMember(memberId) {
    const { error } = await supabase.from('operation_team_members').delete().eq('id', memberId);
    if (error) throw error;
    return true;
  }

  async updateTeamMember(memberId, fields) {
    const { data, error } = await supabase
      .from('operation_team_members')
      .update(fields)
      .eq('id', memberId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Persist explicit ordering for a team's members (display_order = array index)
  async reorderTeamMembers(orderedMemberIds = []) {
    if (!orderedMemberIds.length) return true;
    await Promise.all(
      orderedMemberIds.map((id, index) =>
        supabase.from('operation_team_members').update({ display_order: index }).eq('id', id)
      )
    );
    return true;
  }

  // Find a driver by exact (case-insensitive) full name — used by Excel import
  async findDriverByName(fullName) {
    const name = (fullName || '').trim();
    if (!name) return null;
    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name')
      .ilike('full_name', name)
      .limit(1);
    if (error) throw error;
    return data && data.length ? data[0] : null;
  }

  // Make one member the team lead (demote any existing lead on the same team)
  async setTeamLead(teamId, memberId) {
    await supabase
      .from('operation_team_members')
      .update({ role: 'member' })
      .eq('team_id', teamId)
      .eq('role', 'team_lead');
    return this.updateTeamMember(memberId, { role: 'team_lead' });
  }

  async getShifts(startDate, endDate) {
    const { data, error } = await supabase
      .from('operation_shifts')
      .select(
        `*,
        drivers ( id, full_name, team_type, shift_type ),
        operation_teams ( id, name )`
      )
      .gte('shift_date', startDate)
      .lte('shift_date', endDate)
      .order('shift_date')
      .order('start_time');
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return [];
      throw error;
    }
    return data || [];
  }

  async createShift(shiftData) {
    const { data, error } = await supabase
      .from('operation_shifts')
      .insert([shiftData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

const operationService = new OperationService();
export default operationService;

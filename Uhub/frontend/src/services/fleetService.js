import { supabase } from '../supabaseClient';

class FleetService {
  // ===== VEHICLE MANAGEMENT =====
  
  // Get all vehicles with optional filters
  async getVehicles(filters = {}) {
    try {
      let query = supabase
        .from('fleet_vehicles')
        .select(`
          *,
          departments(name),
          employees!fleet_vehicles_assigned_driver_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters.make) {
        query = query.ilike('make', `%${filters.make}%`);
      }
      if (filters.search) {
        query = query.or(`vehicle_number.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // Get single vehicle by ID
  async getVehicle(id) {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select(`
          *,
          departments(name),
          employees!fleet_vehicles_assigned_driver_id_fkey(full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  // Create new vehicle
  async createVehicle(vehicleData) {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Update vehicle
  async updateVehicle(id, updates) {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete vehicle
  async deleteVehicle(id) {
    try {
      const { error } = await supabase
        .from('fleet_vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // ===== MAINTENANCE MANAGEMENT =====

  // Get maintenance records for a vehicle or all records
  async getMaintenanceRecords(vehicleId = null, filters = {}) {
    try {
      let query = supabase
        .from('fleet_maintenance')
        .select(`
          *,
          fleet_vehicles!inner(
            id,
            vehicle_number,
            make,
            model,
            license_plate,
            status
          ),
          employees!fleet_maintenance_created_by_fkey(
            full_name,
            email
          )
        `)
        .order('service_date', { ascending: false });

      // Filter by vehicle if specified
      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.maintenance_type) {
        query = query.eq('maintenance_type', filters.maintenance_type);
      }
      if (filters.date_from) {
        query = query.gte('service_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('service_date', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,service_provider.ilike.%${filters.search}%,technician_notes.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      throw error;
    }
  }

  // Create maintenance record
  async createMaintenanceRecord(maintenanceData) {
    try {
      const { data, error } = await supabase
        .from('fleet_maintenance')
        .insert([maintenanceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  }

  // Update maintenance record
  async updateMaintenanceRecord(id, updates) {
    try {
      const { data, error } = await supabase
        .from('fleet_maintenance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  }

  // Delete maintenance record
  async deleteMaintenanceRecord(id) {
    try {
      const { error } = await supabase
        .from('fleet_maintenance')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      throw error;
    }
  }

  // Get maintenance statistics
  async getMaintenanceStatistics() {
    try {
      const { data, error } = await supabase
        .from('fleet_maintenance')
        .select('status, cost, maintenance_type, service_date');

      if (error) throw error;

      const stats = {
        totalRecords: data.length,
        totalCost: data.reduce((sum, record) => sum + (record.cost || 0), 0),
        statusBreakdown: {},
        typeBreakdown: {},
        monthlyTrend: {},
        avgCostByType: {}
      };

      // Calculate status breakdown
      data.forEach(record => {
        stats.statusBreakdown[record.status] = (stats.statusBreakdown[record.status] || 0) + 1;
        stats.typeBreakdown[record.maintenance_type] = (stats.typeBreakdown[record.maintenance_type] || 0) + 1;
        
        // Monthly trend
        const month = new Date(record.service_date).toISOString().slice(0, 7);
        if (!stats.monthlyTrend[month]) {
          stats.monthlyTrend[month] = { count: 0, cost: 0 };
        }
        stats.monthlyTrend[month].count += 1;
        stats.monthlyTrend[month].cost += record.cost || 0;
      });

      // Calculate average cost by type
      Object.keys(stats.typeBreakdown).forEach(type => {
        const typeRecords = data.filter(r => r.maintenance_type === type);
        const totalCost = typeRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        stats.avgCostByType[type] = totalCost / typeRecords.length;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching maintenance statistics:', error);
      throw error;
    }
  }

  // ===== FUEL LOGS =====

  // Get fuel logs for a vehicle
  async getFuelLogs(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_fuel_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('fuel_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching fuel logs:', error);
      throw error;
    }
  }

  // Create fuel log
  async createFuelLog(fuelData) {
    try {
      const { data, error } = await supabase
        .from('fleet_fuel_logs')
        .insert([fuelData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating fuel log:', error);
      throw error;
    }
  }

  // ===== INCIDENTS =====

  // Get incidents for a vehicle
  async getIncidents(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_incidents')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('incident_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching incidents:', error);
      throw error;
    }
  }

  // Create incident
  async createIncident(incidentData) {
    try {
      const { data, error } = await supabase
        .from('fleet_incidents')
        .insert([incidentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating incident:', error);
      throw error;
    }
  }

  // ===== DRIVER ASSIGNMENTS =====

  // Get driver assignments for a vehicle
  async getDriverAssignments(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_drivers')
        .select(`
          *,
          employees(full_name, email)
        `)
        .eq('vehicle_id', vehicleId)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching driver assignments:', error);
      throw error;
    }
  }

  // Assign driver to vehicle
  async assignDriver(assignmentData) {
    try {
      // First, deactivate any existing active assignments for this vehicle
      await supabase
        .from('fleet_drivers')
        .update({ is_active: false, unassigned_date: new Date().toISOString() })
        .eq('vehicle_id', assignmentData.vehicle_id)
        .eq('is_active', true);

      // Create new assignment
      const { data, error } = await supabase
        .from('fleet_drivers')
        .insert([assignmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  }

  // ===== STATISTICS AND OVERVIEW =====

  // Get fleet statistics
  async getFleetStatistics() {
    try {
      const { data, error } = await supabase
        .rpc('get_fleet_statistics');

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error fetching fleet statistics:', error);
      throw error;
    }
  }

  // Get fleet overview
  async getFleetOverview() {
    try {
      const { data, error } = await supabase
        .from('fleet_overview')
        .select('*')
        .order('vehicle_number');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching fleet overview:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  // Get available drivers (employees who can drive)
  async getAvailableDrivers() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, department_id')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  }

  // Get departments for vehicle assignment
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Search vehicles
  async searchVehicles(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select(`
          *,
          departments(name),
          employees!fleet_vehicles_assigned_driver_id_fkey(full_name, email)
        `)
        .or(`vehicle_number.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`)
        .order('vehicle_number');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  // Get upcoming maintenance alerts
  async getUpcomingMaintenance() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .lte('next_service_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('next_service_date');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching upcoming maintenance:', error);
      throw error;
    }
  }

  // Get expiring documents (insurance, registration)
  async getExpiringDocuments() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .or(`insurance_expiry.lte.${thirtyDaysFromNow.toISOString().split('T')[0]},registration_expiry.lte.${thirtyDaysFromNow.toISOString().split('T')[0]}`)
        .order('insurance_expiry');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      throw error;
    }
  }
}

export default new FleetService();

import { supabase } from '../supabaseClient';
import { isSampleFleetVehicle } from './fleetVehicleMediaService';

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
        query = query.or(`vehicle_number.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,car_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (filters.excludeSampleData) {
        return (data || []).filter((v) => !isSampleFleetVehicle(v));
      }
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
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        if (error.code === '23503') {
          throw new Error(
            'This vehicle is linked to other records (deliveries, offboarding, etc.). Remove those links first or contact an admin.'
          );
        }
        throw error;
      }

      if (!data?.length) {
        throw new Error(
          'Delete was blocked — you may not have permission. Ask an admin to run fix_fleet_vehicles_delete_rls.sql in Supabase.'
        );
      }

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
      // Fetch records first (only real data from database)
      let query = supabase
        .from('fleet_maintenance')
        .select('*')
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

      if (!data || data.length === 0) {
        return []; // Return empty array if no records - no sample data
      }

      // Fetch related data separately (more reliable)
      const enrichedData = await Promise.all(data.map(async (record) => {
        const [vehicleData, employeeData, ticketData] = await Promise.all([
          record.vehicle_id 
            ? supabase.from('fleet_vehicles').select('id, vehicle_number, make, model, license_plate, status').eq('id', record.vehicle_id).maybeSingle()
            : Promise.resolve({ data: null }),
          record.created_by 
            ? supabase.from('employees').select('id, full_name, email').eq('id', record.created_by).maybeSingle()
            : Promise.resolve({ data: null }),
          // Check if this record was created from a ticket
          supabase.from('fleet_maintenance_tickets').select('id').eq('maintenance_record_id', record.id).maybeSingle()
        ]);

        return {
          ...record,
          fleet_vehicles: vehicleData.data,
          employees: employeeData.data,
          converted_from_ticket: !!ticketData.data // Flag to indicate if converted from ticket
        };
      }));

      return enrichedData;
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
      console.log('Deleting maintenance record with ID:', id);
      
      const { data, error, count } = await supabase
        .from('fleet_maintenance')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(error.message || 'Failed to delete maintenance record');
      }

      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        console.warn('No rows deleted - record may not exist or RLS policy prevented deletion');
        throw new Error('No record was deleted. You may not have permission to delete this record, or it does not exist.');
      }

      console.log('Successfully deleted maintenance record:', data);
      return { success: true, deleted: data };
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      throw error;
    }
  }

  // Get maintenance statistics (only real data from database)
  async getMaintenanceStatistics() {
    try {
      const { data, error } = await supabase
        .from('fleet_maintenance')
        .select('status, cost, maintenance_type, service_date');

      if (error) throw error;

      // Return zeros if no data - no sample data
      if (!data || data.length === 0) {
        return {
          totalRecords: 0,
          totalCost: 0,
          statusBreakdown: {},
          typeBreakdown: {},
          monthlyTrend: {},
          avgCostByType: {}
        };
      }

      const stats = {
        totalRecords: data.length,
        totalCost: data.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0),
        statusBreakdown: {},
        typeBreakdown: {},
        monthlyTrend: {},
        avgCostByType: {}
      };

      // Calculate status breakdown
      data.forEach(record => {
        const status = record.status || 'Unknown';
        const type = record.maintenance_type || 'Unknown';
        stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
        stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
        
        // Monthly trend
        if (record.service_date) {
          const month = new Date(record.service_date).toISOString().slice(0, 7);
          if (!stats.monthlyTrend[month]) {
            stats.monthlyTrend[month] = { count: 0, cost: 0 };
          }
          stats.monthlyTrend[month].count += 1;
          stats.monthlyTrend[month].cost += parseFloat(record.cost) || 0;
        }
      });

      // Calculate average cost by type
      Object.keys(stats.typeBreakdown).forEach(type => {
        const typeRecords = data.filter(r => (r.maintenance_type || 'Unknown') === type);
        const totalCost = typeRecords.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
        stats.avgCostByType[type] = typeRecords.length > 0 ? totalCost / typeRecords.length : 0;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching maintenance statistics:', error);
      // Return empty stats on error - no sample data
      return {
        totalRecords: 0,
        totalCost: 0,
        statusBreakdown: {},
        typeBreakdown: {},
        monthlyTrend: {},
        avgCostByType: {}
      };
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

  // Get all driver assignments (for calendar view)
  async getAllDriverAssignments() {
    try {
      const { data, error } = await supabase
        .from('fleet_drivers')
        .select('*')
        .order('assigned_date', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const vehicleIds = [...new Set(data.map((a) => a.vehicle_id))];
      const { data: vehicles } = await supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, make, model')
        .in('id', vehicleIds);
      const vehicleMap = {};
      (vehicles || []).forEach((v) => { vehicleMap[v.id] = v; });
      const employeeIds = [...new Set(data.map((a) => a.driver_id).filter(Boolean))];
      let employeeMap = {};
      if (employeeIds.length > 0) {
        const { data: employees } = await supabase
          .from('employees')
          .select('id, full_name')
          .in('id', employeeIds);
        (employees || []).forEach((e) => { employeeMap[e.id] = e; });
      }
      return data.map((a) => {
        const v = vehicleMap[a.vehicle_id];
        const e = employeeMap[a.driver_id];
        const vehicleLabel = v ? `${v.vehicle_number} – ${v.make} ${v.model}` : a.vehicle_id;
        const driverLabel = e?.full_name || 'Driver';
        return {
          ...a,
          vehicle_label: vehicleLabel,
          driver_label: driverLabel,
        };
      });
    } catch (err) {
      console.error('getAllDriverAssignments:', err);
      return [];
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

  // Cost per mile / TCO: aggregate by vehicle and fleet-wide from maintenance + vehicles (purchase, mileage)
  async getCostPerMileAndTCO() {
    try {
      const { data: vehicles, error: vErr } = await supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, make, model, mileage, purchase_price');
      if (vErr) throw vErr;

      const { data: maintenance, error: mErr } = await supabase
        .from('fleet_maintenance')
        .select('vehicle_id, cost');
      if (mErr) throw mErr;

      const maintenanceByVehicle = {};
      (maintenance || []).forEach((r) => {
        const id = r.vehicle_id;
        if (!id) return;
        maintenanceByVehicle[id] = (maintenanceByVehicle[id] || 0) + (parseFloat(r.cost) || 0);
      });

      const perVehicle = (vehicles || []).map((v) => {
        const maintCost = maintenanceByVehicle[v.id] || 0;
        const purchase = parseFloat(v.purchase_price) || 0;
        const mileage = parseInt(v.mileage, 10) || 0;
        const totalCost = purchase + maintCost;
        const costPerMile = mileage > 0 ? totalCost / mileage : null;
        return {
          id: v.id,
          vehicle_number: v.vehicle_number,
          make: v.make,
          model: v.model,
          mileage,
          purchase_price: purchase,
          maintenance_cost: maintCost,
          total_cost: totalCost,
          cost_per_mile: costPerMile,
        };
      });

      const fleetTotalMileage = perVehicle.reduce((s, v) => s + v.mileage, 0);
      const fleetTotalCost = perVehicle.reduce((s, v) => s + v.total_cost, 0);
      return {
        perVehicle,
        fleet: {
          totalMileage: fleetTotalMileage,
          totalCost: fleetTotalCost,
          costPerMile: fleetTotalMileage > 0 ? fleetTotalCost / fleetTotalMileage : null,
        },
      };
    } catch (err) {
      console.error('getCostPerMileAndTCO:', err);
      return { perVehicle: [], fleet: { totalMileage: 0, totalCost: 0, costPerMile: null } };
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

  // Get available drivers (operation managers for ticket assignment)
  async getAvailableDrivers() {
    try {
      // First, get users with operation_manager role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, employee_id, role, status')
        .eq('role', 'operation_manager')
        .eq('status', 'active');

      if (usersError) {
        console.error('Error fetching operation managers from users:', usersError);
        throw usersError;
      }

      if (!users || users.length === 0) {
        console.warn('No operation managers found');
        return [];
      }

      // Get employee IDs that are linked to these users
      const employeeIds = users
        .map(u => u.employee_id)
        .filter(Boolean); // Remove null/undefined values

      if (employeeIds.length === 0) {
        console.warn('No employee IDs found for operation managers');
        // Return users data directly if no employee_id links
        return users.map(u => ({
          id: u.employee_id || u.id, // Use employee_id if available, otherwise use user id
          full_name: u.full_name,
          email: u.email
        }));
      }

      // Fetch employee details for these IDs
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, email, department_id, status')
        .in('id', employeeIds)
        .eq('status', 'active')
        .order('full_name');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        // Fallback: return users data if employee fetch fails
        return users.map(u => ({
          id: u.employee_id || u.id,
          full_name: u.full_name,
          email: u.email
        }));
      }

      // Return employees data (preferred) or fallback to users
      if (employees && employees.length > 0) {
        // Sort employees by full_name
        return employees.sort((a, b) => {
          const nameA = (a.full_name || '').toLowerCase();
          const nameB = (b.full_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      }

      // Fallback to users if no employees found - sort by full_name
      return users
        .map(u => ({
          id: u.employee_id || u.id,
          full_name: u.full_name,
          email: u.email
        }))
        .sort((a, b) => {
          const nameA = (a.full_name || '').toLowerCase();
          const nameB = (b.full_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
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

  // ===== MAINTENANCE TICKETS =====

  // Get all maintenance tickets with optional filters
  async getMaintenanceTickets(filters = {}) {
    try {
      // Fetch tickets first
      let query = supabase
        .from('fleet_maintenance_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.maintenance_type) {
        query = query.eq('maintenance_type', filters.maintenance_type);
      }
      if (filters.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.requested_by) {
        query = query.eq('requested_by', filters.requested_by);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch related data separately (more reliable than joins)
      const enrichedData = await Promise.all(data.map(async (ticket) => {
        const [vehicleData, requestedByData, assignedToData] = await Promise.all([
          ticket.vehicle_id 
            ? supabase.from('fleet_vehicles').select('id, vehicle_number, make, model, license_plate, status').eq('id', ticket.vehicle_id).maybeSingle()
            : Promise.resolve({ data: null }),
          ticket.requested_by 
            ? supabase.from('employees').select('id, full_name, email').eq('id', ticket.requested_by).maybeSingle()
            : Promise.resolve({ data: null }),
          ticket.assigned_to 
            ? supabase.from('employees').select('id, full_name, email').eq('id', ticket.assigned_to).maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        return {
          ...ticket,
          fleet_vehicles: vehicleData.data,
          employees: requestedByData.data,
          assigned_employee: assignedToData.data
        };
      }));

      return enrichedData;
    } catch (error) {
      console.error('Error fetching maintenance tickets:', error);
      throw error;
    }
  }

  // Get single ticket by ID
  async getMaintenanceTicket(id) {
    try {
      const { data, error } = await supabase
        .from('fleet_maintenance_tickets')
        .select(`
          *,
          fleet_vehicles(
            id,
            vehicle_number,
            make,
            model,
            license_plate,
            status,
            mileage
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch employee data separately if needed
      const [requestedByData, assignedToData, maintenanceRecordData] = await Promise.all([
        data.requested_by ? supabase.from('employees').select('id, full_name, email').eq('id', data.requested_by).single() : Promise.resolve({ data: null }),
        data.assigned_to ? supabase.from('employees').select('id, full_name, email').eq('id', data.assigned_to).single() : Promise.resolve({ data: null }),
        data.maintenance_record_id ? supabase.from('fleet_maintenance').select('id, description, service_date, cost').eq('id', data.maintenance_record_id).single() : Promise.resolve({ data: null })
      ]);

      return {
        ...data,
        employees: requestedByData.data,
        assigned_employee: assignedToData.data,
        maintenance_record: maintenanceRecordData.data
      };

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching maintenance ticket:', error);
      throw error;
    }
  }

  // Create maintenance ticket
  async createMaintenanceTicket(ticketData) {
    try {
      const { data, error } = await supabase
        .from('fleet_maintenance_tickets')
        .insert([ticketData])
        .select(`
          *,
          fleet_vehicles(
            id,
            vehicle_number,
            make,
            model,
            license_plate
          ),
          employees!requested_by(
            id,
            full_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating maintenance ticket:', error);
      throw error;
    }
  }

  // Update maintenance ticket
  async updateMaintenanceTicket(id, updates) {
    try {
      // First, get the current ticket to check if we need to auto-create a maintenance record
      const { data: currentTicket, error: fetchError } = await supabase
        .from('fleet_maintenance_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Check if status is being set to Completed and no maintenance record exists
      const isBeingCompleted = updates.status === 'Completed' || updates.status === 'Closed';
      const wasNotCompleted = currentTicket.status !== 'Completed' && currentTicket.status !== 'Closed';
      const hasNoMaintenanceRecord = !currentTicket.maintenance_record_id;

      // Update the ticket
      const { data, error } = await supabase
        .from('fleet_maintenance_tickets')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // Auto-create maintenance record if ticket is being completed and no record exists
      if (isBeingCompleted && wasNotCompleted && hasNoMaintenanceRecord) {
        try {
          const maintenanceData = {
            vehicle_id: currentTicket.vehicle_id,
            maintenance_type: currentTicket.maintenance_type || 'Repair',
            description: currentTicket.description || currentTicket.title,
            service_provider: '',
            cost: updates.actual_cost || currentTicket.actual_cost || currentTicket.estimated_cost || null,
            mileage_at_service: currentTicket.mileage_at_request,
            service_date: updates.completed_at ? new Date(updates.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            next_service_date: currentTicket.estimated_completion_date || null,
            status: 'Completed',
            technician_notes: currentTicket.notes || '',
            parts_replaced: [],
            labor_hours: null,
            invoice_number: '',
            created_by: currentTicket.requested_by
          };

          const maintenanceRecord = await this.createMaintenanceRecord(maintenanceData);

          // Link the maintenance record to the ticket
          await supabase
            .from('fleet_maintenance_tickets')
            .update({ maintenance_record_id: maintenanceRecord.id })
            .eq('id', id);

          console.log('Automatically created maintenance record from completed ticket:', maintenanceRecord.id);
        } catch (autoCreateError) {
          console.error('Error auto-creating maintenance record:', autoCreateError);
          // Don't throw - ticket update succeeded, just log the error
        }
      }

      // Fetch related data separately
      const [vehicleData, requestedByData, assignedToData] = await Promise.all([
        data.vehicle_id 
          ? supabase.from('fleet_vehicles').select('id, vehicle_number, make, model, license_plate, status').eq('id', data.vehicle_id).maybeSingle()
          : Promise.resolve({ data: null }),
        data.requested_by 
          ? supabase.from('employees').select('id, full_name, email').eq('id', data.requested_by).maybeSingle()
          : Promise.resolve({ data: null }),
        data.assigned_to 
          ? supabase.from('employees').select('id, full_name, email').eq('id', data.assigned_to).maybeSingle()
          : Promise.resolve({ data: null })
      ]);

      return {
        ...data,
        fleet_vehicles: vehicleData.data,
        employees: requestedByData.data,
        assigned_employee: assignedToData.data
      };
    } catch (error) {
      console.error('Error updating maintenance ticket:', error);
      throw error;
    }
  }

  // Delete maintenance ticket
  async deleteMaintenanceTicket(id) {
    try {
      console.log('Deleting maintenance ticket with ID:', id);
      
      const { data, error } = await supabase
        .from('fleet_maintenance_tickets')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(error.message || 'Failed to delete maintenance ticket');
      }

      // Check if any rows were actually deleted
      if (!data || data.length === 0) {
        console.warn('No rows deleted - ticket may not exist or RLS policy prevented deletion');
        throw new Error('No ticket was deleted. You may not have permission to delete this ticket, or it does not exist.');
      }

      console.log('Successfully deleted maintenance ticket:', data);
      return { success: true, deleted: data };
    } catch (error) {
      console.error('Error deleting maintenance ticket:', error);
      throw error;
    }
  }

  // Convert ticket to maintenance record
  async convertTicketToMaintenanceRecord(ticketId, maintenanceData) {
    try {
      // First create the maintenance record
      const maintenanceRecord = await this.createMaintenanceRecord(maintenanceData);

      // Then update the ticket to link it to the maintenance record
      await this.updateMaintenanceTicket(ticketId, {
        maintenance_record_id: maintenanceRecord.id,
        status: 'Completed',
        actual_cost: maintenanceData.cost
      });

      return maintenanceRecord;
    } catch (error) {
      console.error('Error converting ticket to maintenance record:', error);
      throw error;
    }
  }

  // Get ticket statistics
  async getTicketStatistics() {
    try {
      // Try to get stats from view first
      const { data: viewData, error: viewError } = await supabase
        .from('fleet_maintenance_ticket_stats')
        .select('*')
        .single();

      if (!viewError && viewData) {
        return viewData;
      }

      // If view doesn't exist, calculate stats manually
      const { data: tickets, error: ticketsError } = await supabase
        .from('fleet_maintenance_tickets')
        .select('status, priority, actual_cost, created_at, completed_at');

      if (ticketsError) throw ticketsError;

      // Calculate statistics manually
      const stats = {
        open_tickets: tickets.filter(t => t.status === 'Open').length,
        assigned_tickets: tickets.filter(t => t.status === 'Assigned').length,
        in_progress_tickets: tickets.filter(t => t.status === 'In Progress').length,
        pending_parts_tickets: tickets.filter(t => t.status === 'Pending Parts').length,
        completed_tickets: tickets.filter(t => t.status === 'Completed').length,
        cancelled_tickets: tickets.filter(t => t.status === 'Cancelled').length,
        closed_tickets: tickets.filter(t => t.status === 'Closed').length,
        urgent_tickets: tickets.filter(t => t.priority === 'Urgent').length,
        high_priority_tickets: tickets.filter(t => t.priority === 'High').length,
        total_tickets: tickets.length,
        total_cost: tickets.reduce((sum, t) => sum + (parseFloat(t.actual_cost) || 0), 0),
        avg_completion_days: 0
      };

      // Calculate average completion days
      const completedTickets = tickets.filter(t => t.completed_at && t.created_at);
      if (completedTickets.length > 0) {
        const totalDays = completedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const completed = new Date(t.completed_at);
          const days = (completed - created) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        stats.avg_completion_days = totalDays / completedTickets.length;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching ticket statistics:', error);
      // Return default stats if error occurs
      return {
        open_tickets: 0,
        assigned_tickets: 0,
        in_progress_tickets: 0,
        pending_parts_tickets: 0,
        completed_tickets: 0,
        cancelled_tickets: 0,
        closed_tickets: 0,
        urgent_tickets: 0,
        high_priority_tickets: 0,
        total_tickets: 0,
        total_cost: 0,
        avg_completion_days: 0
      };
    }
  }
}

const fleetService = new FleetService();
export default fleetService;

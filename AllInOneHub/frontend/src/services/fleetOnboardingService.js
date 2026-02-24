import { supabase } from '../supabaseClient';

class FleetOnboardingService {
  // ===== VEHICLE ONBOARDING =====

  // Get all vehicles with onboarding status
  async getOnboardingVehicles(filters = {}) {
    try {
      let query = supabase
        .from('fleet_onboarding_overview')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('onboarding_status', filters.status);
      }
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters.search) {
        query = query.or(`vehicle_number.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`);
      }
      if (filters.date_from) {
        query = query.gte('onboarding_started_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('onboarding_started_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching onboarding vehicles:', error);
      throw error;
    }
  }

  // Get single vehicle with full onboarding details
  async getVehicleOnboardingDetails(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_onboarding_overview')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vehicle onboarding details:', error);
      throw error;
    }
  }

  // Create new vehicle for onboarding
  async createVehicleForOnboarding(vehicleData) {
    try {
      // Start a transaction
      const { data: vehicle, error: vehicleError } = await supabase
        .from('fleet_vehicles_enhanced')
        .insert([{
          ...vehicleData,
          status: 'Onboarding',
          onboarding_status: 'Not Started',
          onboarding_progress: 0
        }])
        .select()
        .single();

      if (vehicleError) throw vehicleError;

      // Create corresponding checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('fleet_onboarding_checklists')
        .insert([{
          vehicle_id: vehicle.id,
          created_by: vehicleData.created_by
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Add history entry
      await this.addOnboardingHistory(
        vehicle.id,
        'Vehicle Created',
        'Started',
        'Vehicle onboarding process initiated',
        vehicleData.created_by
      );

      return { vehicle, checklist };
    } catch (error) {
      console.error('Error creating vehicle for onboarding:', error);
      throw error;
    }
  }

  // Update vehicle information
  async updateVehicleInfo(vehicleId, updates) {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles_enhanced')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      if (updates.updated_by) {
        await this.addOnboardingHistory(
          vehicleId,
          'Vehicle Information',
          'Updated',
          'Vehicle information updated',
          updates.updated_by
        );
      }

      return data;
    } catch (error) {
      console.error('Error updating vehicle info:', error);
      throw error;
    }
  }

  // ===== CHECKLIST MANAGEMENT =====

  // Get checklist for a vehicle
  async getVehicleChecklist(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_onboarding_checklists')
        .select(`
          *,
          car_registration_completed_by_employee:employees!fleet_onboarding_checklists_car_registration_completed_by_fkey(full_name, email),
          passing_completed_by_employee:employees!fleet_onboarding_checklists_passing_completed_by_fkey(full_name, email),
          iot_installation_completed_by_employee:employees!fleet_onboarding_checklists_iot_installation_completed_by_fkey(full_name, email),
          device_config_completed_by_employee:employees!fleet_onboarding_checklists_device_config_completed_by_fkey(full_name, email),
          branding_completed_by_employee:employees!fleet_onboarding_checklists_branding_completed_by_fkey(full_name, email),
          salik_tag_completed_by_employee:employees!fleet_onboarding_checklists_salik_tag_completed_by_fkey(full_name, email),
          vip_chip_completed_by_employee:employees!fleet_onboarding_checklists_vip_chip_completed_by_fkey(full_name, email)
        `)
        .eq('vehicle_id', vehicleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vehicle checklist:', error);
      throw error;
    }
  }

  // Update checklist item
  async updateChecklistItem(vehicleId, itemName, isCompleted, completedBy, notes = '') {
    try {
      const updateData = {
        [itemName]: isCompleted,
        [`${itemName}_completed_at`]: isCompleted ? new Date().toISOString() : null,
        [`${itemName}_completed_by`]: isCompleted ? completedBy : null,
        [`${itemName}_notes`]: notes,
        updated_at: new Date().toISOString(),
        updated_by: completedBy
      };

      const { data, error } = await supabase
        .from('fleet_onboarding_checklists')
        .update(updateData)
        .eq('vehicle_id', vehicleId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await this.addOnboardingHistory(
        vehicleId,
        this.formatChecklistItemName(itemName),
        isCompleted ? 'Completed' : 'Updated',
        notes || `${this.formatChecklistItemName(itemName)} ${isCompleted ? 'completed' : 'updated'}`,
        completedBy
      );

      return data;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      throw error;
    }
  }

  // Format checklist item name for display
  formatChecklistItemName(itemName) {
    const itemNameMap = {
      'car_registration': 'Car Registration',
      'passing_certificate': 'Passing Certificate',
      'iot_device_installation': 'IoT Device Installation',
      'device_configuration': 'Device Configuration',
      'branding_completed': 'Branding',
      'salik_tag_installed': 'Salik Tag',
      'vip_chip_installed': 'VIP Chip'
    };
    return itemNameMap[itemName] || itemName;
  }

  // ===== HISTORY TRACKING =====

  // Add history entry
  async addOnboardingHistory(vehicleId, checklistItem, action, description, performedBy) {
    try {
      const { data, error } = await supabase
        .from('fleet_onboarding_history')
        .insert([{
          vehicle_id: vehicleId,
          checklist_item: checklistItem,
          action: action,
          description: description,
          performed_by: performedBy
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding onboarding history:', error);
      throw error;
    }
  }

  // Get history for a vehicle
  async getVehicleOnboardingHistory(vehicleId) {
    try {
      const { data, error } = await supabase
        .from('fleet_onboarding_history')
        .select(`
          *,
          performed_by_employee:employees(full_name, email)
        `)
        .eq('vehicle_id', vehicleId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vehicle onboarding history:', error);
      throw error;
    }
  }

  // ===== STATISTICS =====

  // Get onboarding statistics
  async getOnboardingStatistics() {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles_enhanced')
        .select('onboarding_status, onboarding_progress, created_at');

      if (error) throw error;

      const stats = {
        totalVehicles: data.length,
        statusBreakdown: {},
        averageProgress: 0,
        completedThisMonth: 0,
        inProgressCount: 0
      };

      const currentMonth = new Date().toISOString().slice(0, 7);

      data.forEach(vehicle => {
        // Status breakdown
        stats.statusBreakdown[vehicle.onboarding_status] = 
          (stats.statusBreakdown[vehicle.onboarding_status] || 0) + 1;

        // Completed this month
        if (vehicle.onboarding_status === 'Completed' && 
            vehicle.created_at?.startsWith(currentMonth)) {
          stats.completedThisMonth += 1;
        }

        // In progress count
        if (vehicle.onboarding_status === 'In Progress') {
          stats.inProgressCount += 1;
        }
      });

      // Calculate average progress
      const totalProgress = data.reduce((sum, vehicle) => sum + (vehicle.onboarding_progress || 0), 0);
      stats.averageProgress = data.length > 0 ? Math.round(totalProgress / data.length) : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching onboarding statistics:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  // Get available departments
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get available drivers
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

  // Calculate progress percentage
  async calculateProgress(vehicleId) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_onboarding_progress', { vehicle_uuid: vehicleId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  }

  // Search vehicles
  async searchVehicles(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('fleet_onboarding_overview')
        .select('*')
        .or(`vehicle_number.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%,iot_device_imei.ilike.%${searchTerm}%,sim_card_imei.ilike.%${searchTerm}%`)
        .order('vehicle_number');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  // Delete vehicle (only if not completed)
  async deleteVehicle(vehicleId) {
    try {
      // Check if vehicle onboarding is completed
      const vehicle = await this.getVehicleOnboardingDetails(vehicleId);
      if (vehicle.onboarding_status === 'Completed') {
        throw new Error('Cannot delete a vehicle with completed onboarding');
      }

      const { error } = await supabase
        .from('fleet_vehicles_enhanced')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Export onboarding data
  async exportOnboardingData(vehicleIds = []) {
    try {
      let query = supabase.from('fleet_onboarding_overview').select('*');
      
      if (vehicleIds.length > 0) {
        query = query.in('id', vehicleIds);
      }

      const { data, error } = await query.order('vehicle_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error exporting onboarding data:', error);
      throw error;
    }
  }
}

const fleetOnboardingService = new FleetOnboardingService();
export default fleetOnboardingService;

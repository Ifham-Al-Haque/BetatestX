import { supabase } from '../supabaseClient';

class DeliveryService {
  // ===== DELIVERY ORDERS =====
  
  // Get all delivery orders with optional filters
  async getOrders(filters = {}) {
    try {
      let query = supabase
        .from('delivery_orders')
        .select(`
          *,
          employees!delivery_orders_created_by_fkey(full_name, email),
          employees!delivery_orders_updated_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.order_type) {
        query = query.eq('order_type', filters.order_type);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.driver_id) {
        query = query.eq('delivery_assignments.driver_id', filters.driver_id);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,pickup_address.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      throw error;
    }
  }

  // Get delivery overview with assignments
  async getDeliveryOverview(filters = {}) {
    try {
      console.log('Fetching delivery overview from fleet_delivery_checklists...');
      
      let query = supabase
        .from('fleet_delivery_checklists')
        .select(`
          *,
          fleet_rental_agreements!fleet_delivery_checklists_rental_agreement_id_fkey(
            id, customer_name, customer_phone, customer_email,
            rental_start_date, rental_end_date, total_amount,
            vehicle_id, driver_id, status, priority, special_requirements
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('fleet_rental_agreements.status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('fleet_rental_agreements.priority', filters.priority);
      }
      if (filters.search) {
        query = query.or(`fleet_rental_agreements.customer_name.ilike.%${filters.search}%,fleet_rental_agreements.customer_phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching fleet delivery checklists:', error);
        throw error;
      }
      
      console.log('Raw data from fleet_delivery_checklists:', data);
      
      // Transform the data to match UI expectations
      const transformedData = data.map(item => ({
        id: item.id,
        order_number: `DEL-${item.id.slice(-8).toUpperCase()}`,
        customer_name: item.fleet_rental_agreements?.customer_name || 'Unknown Customer',
        customer_phone: item.fleet_rental_agreements?.customer_phone || '',
        customer_email: item.fleet_rental_agreements?.customer_email || '',
        pickup_address: 'Pickup Location', // You might want to add this to fleet_rental_agreements
        delivery_address: 'Delivery Location', // You might want to add this to fleet_rental_agreements
        order_type: 'Standard',
        priority: item.fleet_rental_agreements?.priority || 'Medium',
        status: this.mapChecklistStatusToDeliveryStatus(item),
        delivery_fee: item.fleet_rental_agreements?.total_amount || 0,
        payment_status: 'Pending', // You might want to add this to fleet_rental_agreements
        special_instructions: item.fleet_rental_agreements?.special_requirements || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        // Checklist completion status
        vehicle_inspection_completed: item.vehicle_inspection_completed,
        vehicle_cleaning_completed: item.vehicle_cleaning_completed,
        fuel_tank_filled: item.fuel_tank_filled,
        customer_documents_verified: item.customer_documents_verified,
        rental_contract_signed: item.rental_contract_signed,
        payment_confirmation: item.payment_confirmation,
        vehicle_keys_handed: item.vehicle_keys_handed,
        vehicle_demonstration: item.vehicle_demonstration,
        customer_orientation: item.customer_orientation,
        delivery_acknowledgment: item.delivery_acknowledgment,
        all_items_completed: item.all_items_completed,
        // Rental info
        rental_duration: this.calculateRentalDuration(item.fleet_rental_agreements),
        custom_duration: null, // You might want to add this to fleet_rental_agreements
        // Vehicle info (you'll need to join with vehicles table)
        vehicle_number: 'VH-' + item.id.slice(-4).toUpperCase(),
        vehicle_make: 'Vehicle Make', // Join with vehicles table
        vehicle_model: 'Vehicle Model', // Join with vehicles table
        vehicle_plate: 'ABC-123', // Join with vehicles table
        // Driver info (you'll need to join with drivers/employees table)
        driver_name: 'Driver Name', // Join with employees table
        driver_phone: '+971-50-000-0000', // Join with employees table
        driver_license: 'UAE123456789', // Join with employees table
        // Rental agreement reference
        rental_agreement_id: item.rental_agreement_id
      }));
      
      console.log('Transformed data for UI:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching delivery overview:', error);
      throw error;
    }
  }

  // Helper method to map checklist completion status to delivery status
  mapChecklistStatusToDeliveryStatus(item) {
    if (item.all_items_completed) {
      return 'completed';
    } else if (item.delivery_acknowledgment || item.vehicle_keys_handed) {
      return 'in_progress';
    } else if (item.vehicle_inspection_completed || item.customer_documents_verified) {
      return 'in_progress';
    } else {
      return 'not_started';
    }
  }

  // Helper method to calculate rental duration
  calculateRentalDuration(rentalAgreement) {
    if (!rentalAgreement?.rental_start_date || !rentalAgreement?.rental_end_date) {
      return '1_week'; // Default
    }
    
    const startDate = new Date(rentalAgreement.rental_start_date);
    const endDate = new Date(rentalAgreement.rental_end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return '1_day';
    if (diffDays <= 3) return '3_days';
    if (diffDays <= 7) return '1_week';
    if (diffDays <= 14) return '2_weeks';
    if (diffDays <= 30) return '1_month';
    
    return 'custom';
  }

  // Get single order by ID
  async getOrder(id) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          employees!delivery_orders_created_by_fkey(full_name, email),
          employees!delivery_orders_updated_by_fkey(full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery order:', error);
      throw error;
    }
  }

  // Create new delivery order (fleet delivery checklist)
  async createOrder(orderData) {
    try {
      console.log('Creating fleet delivery checklist with data:', JSON.stringify(orderData, null, 2));
      
      // First, create a rental agreement if it doesn't exist
      const rentalAgreementData = {
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        rental_start_date: new Date().toISOString(),
        rental_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        total_amount: orderData.delivery_fee || 0,
        status: 'pending',
        priority: orderData.priority || 'Medium',
        special_requirements: orderData.special_instructions || '',
        created_by: orderData.created_by
      };

      console.log('Creating rental agreement:', rentalAgreementData);
      
      const { data: rentalAgreement, error: rentalError } = await supabase
        .from('fleet_rental_agreements')
        .insert([rentalAgreementData])
        .select()
        .single();

      if (rentalError) {
        console.error('Error creating rental agreement:', rentalError);
        throw rentalError;
      }

      console.log('Rental agreement created:', rentalAgreement);

      // Now create the fleet delivery checklist
      const checklistData = {
        rental_agreement_id: rentalAgreement.id,
        vehicle_inspection_completed: false,
        vehicle_cleaning_completed: false,
        fuel_tank_filled: false,
        customer_documents_verified: false,
        rental_contract_signed: false,
        payment_confirmation: false,
        vehicle_keys_handed: false,
        vehicle_demonstration: false,
        customer_orientation: false,
        delivery_acknowledgment: false,
        all_items_completed: false,
        created_by: orderData.created_by
      };

      console.log('Creating fleet delivery checklist:', checklistData);
      
      const { data, error } = await supabase
        .from('fleet_delivery_checklists')
        .insert([checklistData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }
      
      console.log('Fleet delivery checklist created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating fleet delivery checklist:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Update delivery order (fleet delivery checklist)
  async updateOrder(id, updates) {
    try {
      console.log('Updating fleet delivery checklist with ID:', id, 'Updates:', updates);
      
      // Get the current checklist to find the rental agreement
      const { data: currentChecklist, error: fetchError } = await supabase
        .from('fleet_delivery_checklists')
        .select('rental_agreement_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current checklist:', fetchError);
        throw fetchError;
      }

      // Update the rental agreement with customer info
      const rentalAgreementUpdates = {};
      if (updates.customer_name) rentalAgreementUpdates.customer_name = updates.customer_name;
      if (updates.customer_phone) rentalAgreementUpdates.customer_phone = updates.customer_phone;
      if (updates.customer_email) rentalAgreementUpdates.customer_email = updates.customer_email;
      if (updates.delivery_fee) rentalAgreementUpdates.total_amount = updates.delivery_fee;
      if (updates.priority) rentalAgreementUpdates.priority = updates.priority;
      if (updates.special_instructions) rentalAgreementUpdates.special_requirements = updates.special_instructions;

      if (Object.keys(rentalAgreementUpdates).length > 0) {
        console.log('Updating rental agreement:', currentChecklist.rental_agreement_id, rentalAgreementUpdates);
        
        const { error: rentalError } = await supabase
          .from('fleet_rental_agreements')
          .update(rentalAgreementUpdates)
          .eq('id', currentChecklist.rental_agreement_id);

        if (rentalError) {
          console.error('Error updating rental agreement:', rentalError);
          throw rentalError;
        }
      }

      // Update the checklist itself
      const checklistUpdates = {};
      if (updates.status) {
        // Map delivery status to checklist completion
        if (updates.status === 'completed') {
          checklistUpdates.all_items_completed = true;
        } else if (updates.status === 'in_progress') {
          checklistUpdates.vehicle_inspection_completed = true;
        }
      }

      if (Object.keys(checklistUpdates).length > 0) {
        console.log('Updating checklist:', id, checklistUpdates);
        
        const { data, error } = await supabase
          .from('fleet_delivery_checklists')
          .update(checklistUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating checklist:', error);
          throw error;
        }

        console.log('Checklist updated successfully:', data);
        return data;
      }

      // If no checklist updates, return the current checklist
      const { data, error } = await supabase
        .from('fleet_delivery_checklists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating fleet delivery checklist:', error);
      throw error;
    }
  }

  // Update order status (fleet delivery checklist)
  async updateOrderStatus(id, status) {
    try {
      console.log('Updating fleet delivery checklist status:', { id, status });
      
      // Map delivery status to checklist completion
      const checklistUpdates = {};
      
      switch (status) {
        case 'not_started':
        case 'pending':
          // Reset all to false
          checklistUpdates.vehicle_inspection_completed = false;
          checklistUpdates.vehicle_cleaning_completed = false;
          checklistUpdates.fuel_tank_filled = false;
          checklistUpdates.customer_documents_verified = false;
          checklistUpdates.rental_contract_signed = false;
          checklistUpdates.payment_confirmation = false;
          checklistUpdates.vehicle_keys_handed = false;
          checklistUpdates.vehicle_demonstration = false;
          checklistUpdates.customer_orientation = false;
          checklistUpdates.delivery_acknowledgment = false;
          checklistUpdates.all_items_completed = false;
          break;
          
        case 'in_progress':
          checklistUpdates.vehicle_inspection_completed = true;
          checklistUpdates.vehicle_cleaning_completed = true;
          checklistUpdates.fuel_tank_filled = true;
          break;
          
        case 'completed':
          checklistUpdates.vehicle_inspection_completed = true;
          checklistUpdates.vehicle_cleaning_completed = true;
          checklistUpdates.fuel_tank_filled = true;
          checklistUpdates.customer_documents_verified = true;
          checklistUpdates.rental_contract_signed = true;
          checklistUpdates.payment_confirmation = true;
          checklistUpdates.vehicle_keys_handed = true;
          checklistUpdates.vehicle_demonstration = true;
          checklistUpdates.customer_orientation = true;
          checklistUpdates.delivery_acknowledgment = true;
          checklistUpdates.all_items_completed = true;
          break;
          
        case 'on_hold':
        case 'cancelled':
          // Keep current state but mark as not completed
          checklistUpdates.all_items_completed = false;
          break;
          
        default:
          // No changes for unknown status
          break;
      }

      checklistUpdates.updated_at = new Date().toISOString();
      
      console.log('Updating checklist with:', checklistUpdates);
      
      const { data, error } = await supabase
        .from('fleet_delivery_checklists')
        .update(checklistUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating checklist status:', error);
        throw error;
      }
      
      console.log('Checklist status updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating fleet delivery checklist status:', error);
      throw error;
    }
  }

  // Delete delivery order (fleet delivery checklist)
  async deleteOrder(id) {
    try {
      console.log('Attempting to delete fleet delivery checklist with ID:', id);
      
      const { data, error } = await supabase
        .from('fleet_delivery_checklists')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Fleet delivery checklist deleted successfully:', data);
      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error('Error deleting fleet delivery checklist:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
  }

  // ===== DELIVERY ASSIGNMENTS =====

  // Get assignments for an order
  async getOrderAssignments(orderId) {
    try {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          employees!delivery_assignments_driver_id_fkey(full_name, email, phone),
          employees!delivery_assignments_assigned_by_fkey(full_name, email),
          fleet_vehicles!delivery_assignments_vehicle_id_fkey(vehicle_number, make, model, license_plate)
        `)
        .eq('order_id', orderId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order assignments:', error);
      throw error;
    }
  }

  // Assign delivery to driver
  async assignDelivery(orderId, driverId, vehicleId = null, assignedBy = null) {
    try {
      const { data, error } = await supabase
        .rpc('assign_delivery', {
          p_order_id: orderId,
          p_driver_id: driverId,
          p_vehicle_id: vehicleId,
          p_assigned_by: assignedBy
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning delivery:', error);
      throw error;
    }
  }

  // Update assignment
  async updateAssignment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }

  // ===== DELIVERY TRACKING =====

  // Get tracking history for an order
  async getOrderTracking(orderId) {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select(`
          *,
          employees!delivery_tracking_created_by_fkey(full_name, email)
        `)
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      throw error;
    }
  }

  // Update delivery status
  async updateDeliveryStatus(orderId, status, location = null, notes = null, updatedBy = null) {
    try {
      const { data, error } = await supabase
        .rpc('update_delivery_status', {
          p_order_id: orderId,
          p_status: status,
          p_location: location,
          p_notes: notes,
          p_updated_by: updatedBy
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Add tracking entry
  async addTrackingEntry(trackingData) {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .insert([trackingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding tracking entry:', error);
      throw error;
    }
  }

  // ===== DELIVERY ROUTES =====

  // Get all routes
  async getRoutes(filters = {}) {
    try {
      let query = supabase
        .from('delivery_routes')
        .select(`
          *,
          employees!delivery_routes_driver_id_fkey(full_name, email),
          employees!delivery_routes_created_by_fkey(full_name, email),
          fleet_vehicles!delivery_routes_vehicle_id_fkey(vehicle_number, make, model, license_plate)
        `)
        .order('created_at', { ascending: false });

      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }

  // Create new route
  async createRoute(routeData) {
    try {
      const { data, error } = await supabase
        .from('delivery_routes')
        .insert([routeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  }

  // Get route stops
  async getRouteStops(routeId) {
    try {
      const { data, error } = await supabase
        .from('delivery_route_stops')
        .select(`
          *,
          delivery_orders!delivery_route_stops_order_id_fkey(
            order_number, customer_name, customer_phone, 
            pickup_address, delivery_address, special_instructions
          )
        `)
        .eq('route_id', routeId)
        .order('stop_sequence', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching route stops:', error);
      throw error;
    }
  }

  // Add stop to route
  async addRouteStop(stopData) {
    try {
      const { data, error } = await supabase
        .from('delivery_route_stops')
        .insert([stopData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding route stop:', error);
      throw error;
    }
  }

  // ===== DELIVERY INCIDENTS =====

  // Get incidents for an order
  async getOrderIncidents(orderId) {
    try {
      const { data, error } = await supabase
        .from('delivery_incidents')
        .select(`
          *,
          employees!delivery_incidents_reported_by_fkey(full_name, email)
        `)
        .eq('order_id', orderId)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order incidents:', error);
      throw error;
    }
  }

  // Create incident
  async createIncident(incidentData) {
    try {
      const { data, error } = await supabase
        .from('delivery_incidents')
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

  // ===== STATISTICS AND ANALYTICS =====

  // Get delivery statistics
  async getDeliveryStatistics() {
    try {
      const { data, error } = await supabase
        .rpc('get_delivery_statistics');

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error fetching delivery statistics:', error);
      throw error;
    }
  }

  // Get driver performance
  async getDriverPerformance(driverId = null, dateFrom = null, dateTo = null) {
    try {
      let query = supabase
        .from('driver_performance_summary')
        .select('*');

      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching driver performance:', error);
      throw error;
    }
  }

  // Get delivery performance data
  async getDeliveryPerformance(filters = {}) {
    try {
      let query = supabase
        .from('delivery_performance')
        .select(`
          *,
          employees!delivery_performance_driver_id_fkey(full_name, email)
        `)
        .order('date', { ascending: false });

      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }
      if (filters.date_from) {
        query = query.gte('date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('date', filters.date_to);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery performance:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  // Get available drivers
  async getAvailableDrivers() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, phone, department_id')
        .eq('status', 'active')
        .in('role', ['driver_management', 'employee'])
        .order('full_name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  }

  // Get available vehicles
  async getAvailableVehicles() {
    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('id, vehicle_number, make, model, license_plate, status')
        .eq('status', 'Active')
        .order('vehicle_number');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  }

  // Search orders
  async searchOrders(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          employees!delivery_orders_created_by_fkey(full_name, email)
        `)
        .or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching orders:', error);
      throw error;
    }
  }

  // Get orders by status
  async getOrdersByStatus(status) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          employees!delivery_orders_created_by_fkey(full_name, email)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  }

  // Get today's deliveries
  async getTodaysDeliveries() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching today\'s deliveries:', error);
      throw error;
    }
  }

  // Get upcoming deliveries
  async getUpcomingDeliveries(hours = 24) {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + (hours * 60 * 60 * 1000));
      
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .gte('estimated_delivery_time', now.toISOString())
        .lte('estimated_delivery_time', future.toISOString())
        .order('estimated_delivery_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching upcoming deliveries:', error);
      throw error;
    }
  }
}

const deliveryService = new DeliveryService();
export default deliveryService;

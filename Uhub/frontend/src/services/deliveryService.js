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
      let query = supabase
        .from('delivery_orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }
      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,driver_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery overview:', error);
      throw error;
    }
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

  // Create new delivery order
  async createOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating delivery order:', error);
      throw error;
    }
  }

  // Update delivery order
  async updateOrder(id, updates) {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating delivery order:', error);
      throw error;
    }
  }

  // Delete delivery order
  async deleteOrder(id) {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting delivery order:', error);
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

export default new DeliveryService();

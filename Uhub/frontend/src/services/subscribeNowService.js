import { supabase } from '../supabaseClient';

class SubscribeNowService {
  // ===== CUSTOMER MANAGEMENT =====

  // Get all Subscribe Now customers
  async getCustomers(filters = {}) {
    try {
      let query = supabase
        .from('subscribe_now_customers')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.customer_type) {
        query = query.eq('customer_type', filters.customer_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,customer_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Create new customer
  async createCustomer(customerData) {
    try {
      // Check if customer ID already exists
      if (customerData.customer_id) {
        const { data: existingCustomer } = await supabase
          .from('subscribe_now_customers')
          .select('id, customer_id')
          .eq('customer_id', customerData.customer_id)
          .single();

        if (existingCustomer) {
          throw new Error(`Customer ID "${customerData.customer_id}" already exists. Please use a different ID.`);
        }
      }

      const { data, error } = await supabase
        .from('subscribe_now_customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          if (error.message.includes('customer_id')) {
            throw new Error(`Customer ID "${customerData.customer_id}" already exists. Please use a different ID.`);
          }
          if (error.message.includes('email')) {
            throw new Error(`Email "${customerData.email}" is already registered. Please use a different email.`);
          }
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(customerId, updates) {
    try {
      const { data, error } = await supabase
        .from('subscribe_now_customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(customerId) {
    try {
      // First check if customer has any rental agreements
      const { data: rentals, error: checkError } = await supabase
        .from('fleet_rental_agreements')
        .select('id')
        .eq('customer_id', customerId);

      if (checkError) throw checkError;

      if (rentals && rentals.length > 0) {
        throw new Error('Cannot delete customer with existing rental agreements. Please cancel or complete all rentals first.');
      }

      const { error } = await supabase
        .from('subscribe_now_customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      return { success: true, message: 'Customer deleted successfully' };
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // ===== RENTAL AGREEMENT MANAGEMENT =====

  // Get all rental agreements with delivery overview
  async getRentalAgreements(filters = {}) {
    try {
      let query = supabase
        .from('subscribe_now_delivery_overview')
        .select('*')
        .order('rental_created_at', { ascending: false });

      // Apply filters
      if (filters.agreement_status) {
        query = query.eq('agreement_status', filters.agreement_status);
      }
      if (filters.delivery_status) {
        query = query.eq('delivery_status', filters.delivery_status);
      }
      if (filters.customer_type) {
        query = query.eq('customer_type', filters.customer_type);
      }
      if (filters.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,rental_agreement_id.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%,desired_fleet_type.ilike.%${filters.search}%`);
      }
      if (filters.date_from) {
        query = query.gte('rental_start_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('rental_end_date', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching rental agreements:', error);
      throw error;
    }
  }

  // Get single rental agreement with full details
  async getRentalAgreementDetails(rentalId) {
    try {
      const { data, error } = await supabase
        .from('subscribe_now_delivery_overview')
        .select('*')
        .eq('rental_id', rentalId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching rental agreement details:', error);
      throw error;
    }
  }

  // Create new rental agreement
  async createRentalAgreement(rentalData) {
    try {
      // Start transaction by creating rental agreement
      const { data: rental, error: rentalError } = await supabase
        .from('fleet_rental_agreements')
        .insert([rentalData])
        .select()
        .single();

      if (rentalError) throw rentalError;

      // Create corresponding delivery checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('fleet_delivery_checklists')
        .insert([{
          rental_agreement_id: rental.id,
          created_by: rentalData.created_by
        }])
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Add history entry
      await this.addDeliveryHistory(
        rental.id,
        'Rental Agreement',
        'Started',
        'Rental agreement created and delivery process initiated',
        rentalData.created_by
      );

      return { rental, checklist };
    } catch (error) {
      console.error('Error creating rental agreement:', error);
      throw error;
    }
  }

  // Update rental agreement
  async updateRentalAgreement(rentalId, updates) {
    try {
      const { data, error } = await supabase
        .from('fleet_rental_agreements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', rentalId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry if updated_by is provided
      if (updates.updated_by) {
        await this.addDeliveryHistory(
          rentalId,
          'Rental Agreement',
          'Updated',
          'Rental agreement information updated',
          updates.updated_by
        );
      }

      return data;
    } catch (error) {
      console.error('Error updating rental agreement:', error);
      throw error;
    }
  }

  // Update rental agreement status
  async updateRentalAgreementStatus(rentalId, status, updatedBy, notes = '') {
    try {
      const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Active', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('fleet_rental_agreements')
        .update({
          agreement_status: status,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', rentalId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await this.addDeliveryHistory(
        rentalId,
        'Status Update',
        'Updated',
        `Agreement status changed to: ${status}${notes ? ` - ${notes}` : ''}`,
        updatedBy
      );

      return data;
    } catch (error) {
      console.error('Error updating rental agreement status:', error);
      throw error;
    }
  }

  // Update delivery status
  async updateDeliveryStatus(rentalId, status, updatedBy, notes = '') {
    try {
      const validStatuses = ['Pending', 'In Progress', 'Completed', 'Failed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid delivery status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('fleet_rental_agreements')
        .update({
          delivery_status: status,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', rentalId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await this.addDeliveryHistory(
        rentalId,
        'Delivery Status',
        'Updated',
        `Delivery status changed to: ${status}${notes ? ` - ${notes}` : ''}`,
        updatedBy
      );

      return data;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  }

  // Delete rental agreement
  async deleteRentalAgreement(rentalId) {
    try {
      // Check if rental has any completed delivery items
      const { data: checklist, error: checkError } = await supabase
        .from('fleet_delivery_checklists')
        .select('all_items_completed')
        .eq('rental_agreement_id', rentalId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (checklist && checklist.all_items_completed) {
        throw new Error('Cannot delete rental agreement with completed delivery. Please contact administrator.');
      }

      // Delete in order: history -> checklist -> rental agreement
      await supabase
        .from('fleet_delivery_history')
        .delete()
        .eq('rental_agreement_id', rentalId);

      await supabase
        .from('fleet_delivery_checklists')
        .delete()
        .eq('rental_agreement_id', rentalId);

      const { error } = await supabase
        .from('fleet_rental_agreements')
        .delete()
        .eq('id', rentalId);

      if (error) throw error;
      return { success: true, message: 'Rental agreement deleted successfully' };
    } catch (error) {
      console.error('Error deleting rental agreement:', error);
      throw error;
    }
  }

  // Upload rental contract
  async uploadRentalContract(rentalId, contractFile, uploadedBy) {
    try {
      // Upload file to Supabase Storage
      const fileName = `rental-contracts/${rentalId}/${Date.now()}-${contractFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rental-documents')
        .upload(fileName, contractFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('rental-documents')
        .getPublicUrl(fileName);

      // Update rental agreement with contract URL
      const { data, error } = await supabase
        .from('fleet_rental_agreements')
        .update({
          rental_contract_url: urlData.publicUrl,
          contract_upload_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: uploadedBy
        })
        .eq('id', rentalId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await this.addDeliveryHistory(
        rentalId,
        'Contract Upload',
        'Completed',
        `Rental contract uploaded: ${contractFile.name}`,
        uploadedBy
      );

      return data;
    } catch (error) {
      console.error('Error uploading rental contract:', error);
      throw error;
    }
  }

  // ===== DELIVERY CHECKLIST MANAGEMENT =====

  // Get delivery checklist for a rental
  async getDeliveryChecklist(rentalId) {
    try {
      const { data, error } = await supabase
        .from('fleet_delivery_checklists')
        .select(`
          *,
          vehicle_inspection_by_employee:employees!fleet_delivery_checklists_vehicle_inspection_by_fkey(full_name, email),
          vehicle_cleaning_by_employee:employees!fleet_delivery_checklists_vehicle_cleaning_by_fkey(full_name, email),
          fuel_fill_by_employee:employees!fleet_delivery_checklists_fuel_fill_by_fkey(full_name, email),
          documents_verified_by_employee:employees!fleet_delivery_checklists_documents_verified_by_fkey(full_name, email),
          contract_signed_by_employee:employees!fleet_delivery_checklists_contract_signed_by_fkey(full_name, email),
          payment_confirmed_by_employee:employees!fleet_delivery_checklists_payment_confirmed_by_fkey(full_name, email),
          keys_handed_by_employee:employees!fleet_delivery_checklists_keys_handed_by_fkey(full_name, email),
          demonstration_by_employee:employees!fleet_delivery_checklists_demonstration_by_fkey(full_name, email),
          orientation_by_employee:employees!fleet_delivery_checklists_orientation_by_fkey(full_name, email),
          acknowledged_by_employee:employees!fleet_delivery_checklists_acknowledged_by_fkey(full_name, email)
        `)
        .eq('rental_agreement_id', rentalId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery checklist:', error);
      throw error;
    }
  }

  // Update delivery checklist item
  async updateDeliveryChecklistItem(rentalId, itemName, isCompleted, completedBy, notes = '') {
    try {
      const updateData = {
        [itemName]: isCompleted,
        [`${itemName}_date`]: isCompleted ? new Date().toISOString() : null,
        [`${itemName}_by`]: isCompleted ? completedBy : null,
        [`${itemName}_notes`]: notes,
        updated_at: new Date().toISOString(),
        updated_by: completedBy
      };

      const { data, error } = await supabase
        .from('fleet_delivery_checklists')
        .update(updateData)
        .eq('rental_agreement_id', rentalId)
        .select()
        .single();

      if (error) throw error;

      // Add history entry
      await this.addDeliveryHistory(
        rentalId,
        this.formatChecklistItemName(itemName),
        isCompleted ? 'Completed' : 'Updated',
        notes || `${this.formatChecklistItemName(itemName)} ${isCompleted ? 'completed' : 'updated'}`,
        completedBy
      );

      return data;
    } catch (error) {
      console.error('Error updating delivery checklist item:', error);
      throw error;
    }
  }

  // Format checklist item name for display
  formatChecklistItemName(itemName) {
    const itemNameMap = {
      'vehicle_inspection_completed': 'Vehicle Inspection',
      'vehicle_cleaning_completed': 'Vehicle Cleaning',
      'fuel_tank_filled': 'Fuel Tank Fill',
      'customer_documents_verified': 'Document Verification',
      'rental_contract_signed': 'Contract Signing',
      'payment_confirmation': 'Payment Confirmation',
      'vehicle_keys_handed': 'Key Handover',
      'vehicle_demonstration': 'Vehicle Demonstration',
      'customer_orientation': 'Customer Orientation',
      'delivery_acknowledgment': 'Delivery Acknowledgment'
    };
    return itemNameMap[itemName] || itemName;
  }

  // ===== DELIVERY HISTORY TRACKING =====

  // Add delivery history entry
  async addDeliveryHistory(rentalId, checklistItem, action, description, performedBy) {
    try {
      const { data, error } = await supabase
        .from('fleet_delivery_history')
        .insert([{
          rental_agreement_id: rentalId,
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
      console.error('Error adding delivery history:', error);
      throw error;
    }
  }

  // Get delivery history for a rental
  async getDeliveryHistory(rentalId) {
    try {
      const { data, error } = await supabase
        .from('fleet_delivery_history')
        .select(`
          *,
          performed_by_employee:employees(full_name, email)
        `)
        .eq('rental_agreement_id', rentalId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      throw error;
    }
  }

  // ===== STATISTICS AND ANALYTICS =====

  // Get Subscribe Now delivery statistics
  async getDeliveryStatistics() {
    try {
      const { data, error } = await supabase
        .from('fleet_rental_agreements')
        .select('agreement_status, delivery_status, confirmed_amount, created_at');

      if (error) throw error;

      const stats = {
        totalRentals: data.length,
        totalRevenue: data.reduce((sum, rental) => sum + (rental.confirmed_amount || 0), 0),
        agreementStatusBreakdown: {},
        deliveryStatusBreakdown: {},
        completedThisMonth: 0,
        avgDeliveryProgress: 0
      };

      const currentMonth = new Date().toISOString().slice(0, 7);

      data.forEach(rental => {
        // Agreement status breakdown
        stats.agreementStatusBreakdown[rental.agreement_status] = 
          (stats.agreementStatusBreakdown[rental.agreement_status] || 0) + 1;

        // Delivery status breakdown
        stats.deliveryStatusBreakdown[rental.delivery_status] = 
          (stats.deliveryStatusBreakdown[rental.delivery_status] || 0) + 1;

        // Completed this month
        if (rental.delivery_status === 'Completed' && 
            rental.created_at?.startsWith(currentMonth)) {
          stats.completedThisMonth += 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching delivery statistics:', error);
      throw error;
    }
  }

  // Get fleet rental service statistics for subscription services tab
  async getFleetRentalServiceStats() {
    try {
      // Get available vehicles allocated to Subscribe Now department
      const { data: availableVehicles, error: vehiclesError } = await supabase
        .from('fleet_vehicles_enhanced')
        .select(`
          id, vehicle_number, make, model, status,
          departments!inner(name)
        `)
        .eq('departments.name', 'Subscribe Now')
        .eq('status', 'Active')
        .is('assigned_driver_id', null); // Available for rental

      if (vehiclesError) throw vehiclesError;

      // Get active rental agreements (customers currently renting)
      const { data: activeRentals, error: activeError } = await supabase
        .from('subscribe_now_delivery_overview')
        .select('*')
        .in('agreement_status', ['Active', 'Approved'])
        .in('delivery_status', ['Completed', 'In Progress']);

      if (activeError) throw activeError;

      // Get pending rental confirmations
      const { data: pendingRentals, error: pendingError } = await supabase
        .from('subscribe_now_delivery_overview')
        .select('*')
        .in('agreement_status', ['Draft', 'Pending Approval'])
        .neq('delivery_status', 'Completed');

      if (pendingError) throw pendingError;

      // Get total customers who have rented (including completed rentals)
      const { data: totalCustomers, error: customersError } = await supabase
        .from('subscribe_now_customers')
        .select('id, customer_name, customer_type, created_at');

      if (customersError) throw customersError;

      // Calculate revenue statistics
      const totalRevenue = activeRentals.reduce((sum, rental) => sum + (rental.confirmed_amount || 0), 0);
      const avgRentalAmount = activeRentals.length > 0 ? totalRevenue / activeRentals.length : 0;

      return {
        availableServices: availableVehicles?.length || 0,
        activeSubscriptions: activeRentals?.length || 0,
        pendingConfirmations: pendingRentals?.length || 0,
        totalUsers: totalCustomers?.length || 0,
        totalRevenue: totalRevenue,
        averageRentalAmount: avgRentalAmount,
        availableVehicles: availableVehicles || [],
        activeRentals: activeRentals || [],
        pendingRentals: pendingRentals || [],
        customerBreakdown: {
          individual: totalCustomers?.filter(c => c.customer_type === 'Individual').length || 0,
          corporate: totalCustomers?.filter(c => c.customer_type === 'Corporate').length || 0
        }
      };
    } catch (error) {
      console.error('Error fetching fleet rental service stats:', error);
      throw error;
    }
  }

  // Get fleet service details for subscription services display
  async getFleetServiceDetails() {
    try {
      const stats = await this.getFleetRentalServiceStats();
      
      const services = [
        {
          id: 'available-fleet',
          name: 'Available Fleet Vehicles',
          category: 'Fleet Availability',
          description: 'Vehicles ready for long-term rental allocation',
          count: stats.availableServices,
          status: 'available',
          icon: 'Car',
          details: `${stats.availableServices} vehicles ready for rental`,
          color: 'green'
        },
        {
          id: 'active-rentals',
          name: 'Active Rental Agreements',
          category: 'Current Rentals',
          description: 'Customers currently renting fleet vehicles',
          count: stats.activeSubscriptions,
          status: 'active',
          icon: 'Users',
          details: `${stats.activeSubscriptions} vehicles currently rented`,
          revenue: stats.totalRevenue,
          color: 'blue'
        },
        {
          id: 'pending-confirmations',
          name: 'Pending Confirmations',
          category: 'Pending Approvals',
          description: 'Rental agreements awaiting confirmation',
          count: stats.pendingConfirmations,
          status: 'pending',
          icon: 'Clock',
          details: `${stats.pendingConfirmations} rentals pending approval`,
          color: 'yellow'
        },
        {
          id: 'customer-base',
          name: 'Total Customer Base',
          category: 'Customer Management',
          description: 'All customers who have engaged with rental services',
          count: stats.totalUsers,
          status: 'active',
          icon: 'UserCheck',
          details: `${stats.customerBreakdown.individual} Individual, ${stats.customerBreakdown.corporate} Corporate`,
          color: 'purple'
        }
      ];

      return {
        services,
        statistics: stats
      };
    } catch (error) {
      console.error('Error fetching fleet service details:', error);
      throw error;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  // Get available vehicles for rental
  async getAvailableVehicles(fleetType = '') {
    try {
      let query = supabase
        .from('fleet_vehicles_enhanced')
        .select('id, vehicle_number, make, model, model_year, color, status')
        .eq('status', 'Active')
        .is('assigned_driver_id', null); // Available vehicles

      if (fleetType) {
        // You can add more sophisticated matching based on vehicle type
        query = query.or(`make.ilike.%${fleetType}%,model.ilike.%${fleetType}%`);
      }

      const { data, error } = await query.order('vehicle_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  }

  // Check if customer ID is available
  async isCustomerIdAvailable(customerId) {
    try {
      const { data, error } = await supabase
        .from('subscribe_now_customers')
        .select('id')
        .eq('customer_id', customerId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, ID is available
        return true;
      }

      // If we get data, ID already exists
      return false;
    } catch (error) {
      console.error('Error checking customer ID availability:', error);
      return false;
    }
  }

  // Generate customer ID
  async generateCustomerId() {
    try {
      const { data, error } = await supabase
        .from('subscribe_now_customers')
        .select('customer_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data.length > 0) {
        const lastId = data[0].customer_id;
        const match = lastId.match(/SN-CUST-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `SN-CUST-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating customer ID:', error);
      return `SN-CUST-${Date.now()}`;
    }
  }

  // Generate rental agreement ID
  async generateRentalId() {
    try {
      const { data, error } = await supabase
        .from('fleet_rental_agreements')
        .select('rental_agreement_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data.length > 0) {
        const lastId = data[0].rental_agreement_id;
        const match = lastId.match(/SN-RENTAL-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `SN-RENTAL-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating rental ID:', error);
      return `SN-RENTAL-${Date.now()}`;
    }
  }

  // Search functionality
  async searchRentals(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('subscribe_now_delivery_overview')
        .select('*')
        .or(`customer_name.ilike.%${searchTerm}%,rental_agreement_id.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,vehicle_number.ilike.%${searchTerm}%,desired_fleet_type.ilike.%${searchTerm}%`)
        .order('rental_created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching rentals:', error);
      throw error;
    }
  }

  // Export delivery data
  async exportDeliveryData(rentalIds = []) {
    try {
      let query = supabase.from('subscribe_now_delivery_overview').select('*');
      
      if (rentalIds.length > 0) {
        query = query.in('rental_id', rentalIds);
      }

      const { data, error } = await query.order('rental_agreement_id');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error exporting delivery data:', error);
      throw error;
    }
  }

  // Export customers data
  async exportCustomersData(customerIds = []) {
    try {
      let query = supabase.from('subscribe_now_customers').select('*');
      
      if (customerIds.length > 0) {
        query = query.in('id', customerIds);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error exporting customers data:', error);
      throw error;
    }
  }

  // Export delivery history
  async exportDeliveryHistory(rentalIds = []) {
    try {
      let query = supabase
        .from('fleet_delivery_history')
        .select(`
          *,
          rental_agreement:rental_agreement_id(rental_agreement_id),
          performed_by_employee:employees(full_name, email)
        `);
      
      if (rentalIds.length > 0) {
        query = query.in('rental_agreement_id', rentalIds);
      }

      const { data, error } = await query.order('performed_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error exporting delivery history:', error);
      throw error;
    }
  }

  // Export comprehensive report
  async exportComprehensiveReport(filters = {}) {
    try {
      const [rentals, customers, history] = await Promise.all([
        this.exportDeliveryData(filters.rentalIds || []),
        this.exportCustomersData(filters.customerIds || []),
        this.exportDeliveryHistory(filters.rentalIds || [])
      ]);

      return {
        rentals,
        customers,
        history,
        exportDate: new Date().toISOString(),
        filters: filters
      };
    } catch (error) {
      console.error('Error exporting comprehensive report:', error);
      throw error;
    }
  }

  // Generate CSV data for export
  generateCSVData(data, type = 'rentals') {
    if (!data || data.length === 0) return '';

    const headers = this.getCSVHeaders(type);
    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const values = headers.map(header => {
        const value = this.getNestedValue(item, header);
        // Escape commas and quotes in CSV
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  // Get CSV headers based on data type
  getCSVHeaders(type) {
    const headerMap = {
      'rentals': [
        'rental_id', 'rental_agreement_id', 'customer_name', 'customer_code', 'email', 'phone',
        'customer_type', 'desired_fleet_type', 'vehicle_number', 'vehicle_make', 'vehicle_model',
        'original_rental_amount', 'confirmed_amount', 'security_deposit', 'rental_duration_months',
        'rental_start_date', 'rental_end_date', 'agreement_status', 'delivery_status',
        'delivery_progress', 'rental_created_at'
      ],
      'customers': [
        'customer_id', 'customer_name', 'email', 'phone', 'address', 'emirates_id',
        'driving_license', 'passport_number', 'company_name', 'designation',
        'customer_type', 'status', 'created_at'
      ],
      'history': [
        'rental_agreement_id', 'checklist_item', 'action', 'description',
        'performed_by_name', 'performed_at'
      ]
    };

    return headerMap[type] || [];
  }

  // Get nested value from object using dot notation
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Calculate delivery progress
  async calculateDeliveryProgress(rentalId) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_delivery_progress', { rental_uuid: rentalId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating delivery progress:', error);
      return 0;
    }
  }
}

const subscribeNowService = new SubscribeNowService();
export default subscribeNowService;

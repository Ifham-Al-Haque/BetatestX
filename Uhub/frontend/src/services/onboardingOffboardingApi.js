import { supabase } from '../supabaseClient';

export const onboardingOffboardingApi = {
  // ==================== ONBOARDING RECORDS ====================
  onboardingRecords: {
    create: async (employeeData, onboardingData) => {
      try {
        console.log('Creating onboarding record with data:', { employeeData, onboardingData });
        
        // Use ONLY the absolute minimum fields to avoid column errors
        const onboardingRecordData = {
          // Core Employee Information (guaranteed safe)
          full_name: employeeData.full_name,
          employee_id: employeeData.employee_id,
          email: employeeData.email,
          phone: employeeData.phone,
          position: employeeData.position,
          department: employeeData.department,
          start_date: employeeData.start_date,
          
          // Core Onboarding Information (guaranteed safe)
          template_id: onboardingData.template_id,
          expected_completion_date: onboardingData.expected_completion_date,
          notes: onboardingData.notes || '',
          onboarding_status: 'pending'
        };

        // Only add these fields if they have values (avoid null/undefined)
        if (onboardingData.created_by) {
          onboardingRecordData.created_by = onboardingData.created_by;
        }
        if (onboardingData.assigned_to) {
          onboardingRecordData.assigned_to = onboardingData.assigned_to;
        }

        const { data, error } = await supabase
          .from('employee_onboarding_records')
          .insert(onboardingRecordData)
          .select()
          .single();

        if (error) {
          console.error('Onboarding record creation error:', error);
          
          // If error is about missing columns, try with minimal data
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log('🔄 Schema mismatch detected. Retrying with minimal required fields...');
            
            const minimalData = {
              full_name: employeeData.full_name,
              employee_id: employeeData.employee_id,
              email: employeeData.email,
              phone: employeeData.phone,
              position: employeeData.position,
              department: employeeData.department,
              start_date: employeeData.start_date,
              template_id: onboardingData.template_id,
              expected_completion_date: onboardingData.expected_completion_date,
              notes: onboardingData.notes || '',
              onboarding_status: 'pending'
            };
            
            // Only add created_by and assigned_to if they have values
            if (onboardingData.created_by) {
              minimalData.created_by = onboardingData.created_by;
            }
            if (onboardingData.assigned_to) {
              minimalData.assigned_to = onboardingData.assigned_to;
            }
            
            const { data: retryData, error: retryError } = await supabase
              .from('employee_onboarding_records')
              .insert(minimalData)
              .select()
              .single();
            
            if (retryError) {
              throw new Error(`Database schema issue: ${retryError.message}. Please run the database setup script: create_onboarding_offboarding_tables.sql`);
            }
            
            console.log('✅ Onboarding record created with minimal data:', retryData);
            return retryData;
          }
          
          throw error;
        }

        console.log('Onboarding record created successfully:', data);
        return data;
      } catch (error) {
        console.error('Error creating onboarding record:', error);
        throw error;
      }
    },

    getAll: async () => {
      try {
        console.log('Fetching onboarding records...');
        
        // Try the view first, then fallback to base table, then return empty array
        
        // Attempt 1: Try the onboarding_dashboard view
        try {
          const viewResult = await supabase
            .from('onboarding_dashboard')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!viewResult.error) {
            console.log('✅ Data loaded from onboarding_dashboard view');
            return viewResult.data || [];
          }
          
          console.log('⚠️ onboarding_dashboard view not available, trying base table...');
        } catch (viewError) {
          console.log('⚠️ onboarding_dashboard view failed:', viewError.message);
        }
        
        // Attempt 2: Try the base table
        try {
          const tableResult = await supabase
            .from('employee_onboarding_records')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!tableResult.error) {
            console.log('✅ Data loaded from employee_onboarding_records table');
            return tableResult.data || [];
          }
          
          console.log('⚠️ employee_onboarding_records table error:', tableResult.error.message);
        } catch (tableError) {
          console.log('⚠️ employee_onboarding_records table failed:', tableError.message);
        }
        
        // Attempt 3: Return empty array if both fail
        console.log('ℹ️ No onboarding data available - tables may not exist yet');
        return [];
        
      } catch (error) {
        console.error('Error fetching onboarding records:', error);
        // Return empty array instead of throwing error
        return [];
      }
    },

    getById: async (id) => {
      try {
        console.log('Fetching onboarding record by ID:', id);
        
        // Try both id and record_id fields to find the record
        let query = supabase
          .from('employee_onboarding_records')
          .select('*');
        
        // First try with the main id field
        const { data: dataById, error: errorById } = await query.eq('id', id).maybeSingle();
        
        if (!errorById && dataById) {
          console.log('✅ Found record by id field');
          return dataById;
        }
        
        // If not found by id, try record_id field
        const { data: dataByRecordId, error: errorByRecordId } = await query.eq('record_id', id).maybeSingle();
        
        if (!errorByRecordId && dataByRecordId) {
          console.log('✅ Found record by record_id field');
          return dataByRecordId;
        }
        
        // If still not found, check what records exist
        const { data: allRecords } = await supabase
          .from('employee_onboarding_records')
          .select('id, record_id, full_name, email')
          .limit(5);
        
        console.log('Available records:', allRecords);
        console.log('Looking for ID:', id);
        
        // Check if the ID matches any field in the available records
        const matchingRecord = allRecords?.find(r => 
          r.id === id || 
          r.record_id === id || 
          r.email === id ||
          r.full_name === id
        );
        
        if (matchingRecord) {
          console.log('✅ Found matching record:', matchingRecord);
          return matchingRecord;
        }
        
        // If we have records but no match, show detailed info
        if (allRecords && allRecords.length > 0) {
          console.log('❌ ID mismatch detected:');
          console.log('Searching for:', id);
          console.log('Available IDs:');
          allRecords.forEach(r => {
            console.log(`- Main ID: ${r.id}`);
            console.log(`- Record ID: ${r.record_id}`);
            console.log(`- Name: ${r.full_name}`);
          });
        }
        
        throw new Error(`Onboarding record not found with ID: ${id}. Available records: ${allRecords?.length || 0}`);
        
      } catch (error) {
        console.error('Error fetching onboarding record:', error);
        throw error;
      }
    },

    update: async (id, updates) => {
      try {
        console.log('Updating onboarding record:', id, updates);
        
        const { data, error } = await supabase
          .from('employee_onboarding_records')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        console.log('✅ Onboarding record updated successfully');
        return data;
      } catch (error) {
        console.error('Error updating onboarding record:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        console.log('Deleting onboarding record:', id);
        
        // First check if record exists
        const { data: existingRecord } = await supabase
          .from('employee_onboarding_records')
          .select('id, full_name')
          .eq('id', id)
          .maybeSingle();
        
        if (!existingRecord) {
          throw new Error('Onboarding record not found');
        }
        
        // Delete the record
        const { error } = await supabase
          .from('employee_onboarding_records')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        
        console.log('✅ Onboarding record deleted successfully:', existingRecord.full_name);
        return true;
      } catch (error) {
        console.error('Error deleting onboarding record:', error);
        throw error;
      }
    },

    // Create actual employee record from onboarding data
    createEmployeeRecord: async (onboardingRecordId) => {
      try {
        const { data, error } = await supabase.rpc(
          'create_employee_from_onboarding',
          { onboarding_record_id: onboardingRecordId }
        );

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating employee record:', error);
        throw error;
      }
    }
  },

  // ==================== ONBOARDING TEMPLATES ====================
  templates: {
    getAll: async () => {
      try {
        console.log('Fetching onboarding templates...');
        
        const { data, error } = await supabase
          .from('employee_onboarding_templates')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Templates fetch error:', error);
          
          // If table doesn't exist, return default templates
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            console.log('⚠️ Templates table does not exist, returning default templates');
            return [
              {
                id: 'default-1',
                name: 'General Onboarding',
                description: 'Standard onboarding process for all new employees',
                department: 'All',
                is_active: true
              },
              {
                id: 'default-2',
                name: 'IT Onboarding',
                description: 'Technical onboarding for IT department',
                department: 'IT',
                is_active: true
              }
            ];
          }
          
          // For other errors, return empty array
          console.log('ℹ️ No templates available');
          return [];
        }

        console.log('✅ Templates loaded:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    },

    getById: async (templateId) => {
      const { data, error } = await supabase
        .from('employee_onboarding_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (templateData) => {
      const { data, error } = await supabase
        .from('employee_onboarding_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (templateId, updates) => {
      const { data, error } = await supabase
        .from('employee_onboarding_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (templateId) => {
      const { error } = await supabase
        .from('employee_onboarding_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    }
  },

  // ==================== ONBOARDING RECORDS ====================
  onboarding: {
    // Get all onboarding records with employee details
    getAll: async () => {
      const { data, error } = await supabase
        .from('onboarding_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    // Get onboarding record by ID
    getById: async (recordId) => {
      const { data, error } = await supabase
        .from('employee_onboarding_records')
        .select(`
          *,
          employee:employees(full_name, email, department, position),
          template:employee_onboarding_templates(name),
          onboarding_buddy:employees!onboarding_buddy_fkey(full_name, email),
          hr_contact:employees!hr_contact_fkey(full_name, email),
          department_manager:employees!department_manager_fkey(full_name, email)
        `)
        .eq('id', recordId)
        .single();

      if (error) throw error;
      return data;
    },

    // Get onboarding record by employee ID
    getByEmployeeId: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_onboarding_records')
        .select(`
          *,
          template:employee_onboarding_templates(name)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    // Create new onboarding record
    create: async (onboardingData) => {
      const { data, error } = await supabase
        .from('employee_onboarding_records')
        .insert(onboardingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Update onboarding record
    update: async (recordId, updates) => {
      const { data, error } = await supabase
        .from('employee_onboarding_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Start onboarding process for employee
    startOnboarding: async (employeeId, templateId, additionalData = {}) => {
      // Get template to create checklist items
      await onboardingOffboardingApi.templates.getById(templateId);
      
      // Create onboarding record
      const onboardingRecord = await onboardingOffboardingApi.onboarding.create({
        employee_id: employeeId,
        template_id: templateId,
        start_date: new Date().toISOString().split('T')[0],
        expected_completion_date: additionalData.expected_completion_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks default
        onboarding_buddy: additionalData.onboarding_buddy,
        hr_contact: additionalData.hr_contact,
        department_manager: additionalData.department_manager,
        notes: additionalData.notes,
        created_by: additionalData.created_by
      });

      // Create checklist items from template
      const { data: templateItems, error: templateError } = await supabase
        .from('employee_onboarding_checklist')
        .select('checklist_item, category, description, order_index, priority')
        .eq('onboarding_id', templateId);

      if (templateError) throw templateError;

      // Insert checklist items for this employee
      const checklistItems = templateItems.map(item => ({
        onboarding_id: templateId,
        employee_id: employeeId,
        checklist_item: item.checklist_item,
        category: item.category,
        description: item.description,
        order_index: item.order_index,
        priority: item.priority,
        assigned_to: additionalData.assigned_to || null,
        due_date: additionalData.due_date || null
      }));

      const { error: checklistError } = await supabase
        .from('employee_onboarding_checklist')
        .insert(checklistItems);

      if (checklistError) throw checklistError;

      return onboardingRecord;
    },

    // Complete onboarding process
    completeOnboarding: async (recordId) => {
      const { data, error } = await supabase
        .from('employee_onboarding_records')
        .update({
          status: 'completed',
          actual_completion_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== ONBOARDING CHECKLIST ====================
  onboardingChecklist: {
    getByEmployeeId: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_onboarding_checklist')
        .select(`
          *,
          assigned_to_employee:employees!assigned_to_fkey(full_name, email),
          completed_by_employee:employees!completed_by_fkey(full_name, email)
        `)
        .eq('employee_id', employeeId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },

    markComplete: async (itemId, completedBy, notes = '') => {
      const { data, error } = await supabase
        .from('employee_onboarding_checklist')
        .update({
          is_completed: true,
          completed_by: completedBy,
          completed_at: new Date().toISOString(),
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    markIncomplete: async (itemId) => {
      const { data, error } = await supabase
        .from('employee_onboarding_checklist')
        .update({
          is_completed: false,
          completed_by: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateItem: async (itemId, updates) => {
      const { data, error } = await supabase
        .from('employee_onboarding_checklist')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    addCustomItem: async (itemData) => {
      const { data, error } = await supabase
        .from('employee_onboarding_checklist')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== OFFBOARDING RECORDS ====================
  offboarding: {
    // Get all offboarding records with employee details
    getAll: async () => {
      const { data, error } = await supabase
        .from('offboarding_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    // Get offboarding record by ID
    getById: async (recordId) => {
      const { data, error } = await supabase
        .from('employee_offboarding_records')
        .select(`
          *,
          employee:employees(full_name, email, department, position),
          exit_interview_conducted_by_employee:employees!exit_interview_conducted_by_fkey(full_name, email),
          hr_contact:employees!hr_contact_fkey(full_name, email),
          department_manager:employees!department_manager_fkey(full_name, email),
          handover_to:employees!handover_to_fkey(full_name, email)
        `)
        .eq('id', recordId)
        .single();

      if (error) throw error;
      return data;
    },

    // Get offboarding record by employee ID
    getByEmployeeId: async (employeeId) => {
      const { data, error } = await supabase
        .from('employee_offboarding_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    // Create new offboarding record
    create: async (offboardingData) => {
      const { data, error } = await supabase
        .from('employee_offboarding_records')
        .insert(offboardingData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Update offboarding record
    update: async (recordId, updates) => {
      const { data, error } = await supabase
        .from('employee_offboarding_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Start offboarding process for employee
    startOffboarding: async (employeeId, offboardingData) => {
      // Create offboarding record
      const offboardingRecord = await onboardingOffboardingApi.offboarding.create({
        employee_id: employeeId,
        last_working_date: offboardingData.last_working_date,
        termination_date: offboardingData.termination_date,
        reason_for_leaving: offboardingData.reason_for_leaving,
        reason_details: offboardingData.reason_details,
        hr_contact: offboardingData.hr_contact,
        department_manager: offboardingData.department_manager,
        handover_to: offboardingData.handover_to,
        notes: offboardingData.notes,
        created_by: offboardingData.created_by
      });

      // Create default offboarding checklist
      const defaultChecklist = [
        // IT Assets
        { checklist_item: 'Laptop Return', category: 'it_assets', description: 'Return company laptop and accessories', order_index: 1, priority: 'high' },
        { checklist_item: 'Phone Return', category: 'it_assets', description: 'Return company phone and accessories', order_index: 2, priority: 'high' },
        { checklist_item: 'Access Card Return', category: 'it_assets', description: 'Return access card and keys', order_index: 3, priority: 'high' },
        { checklist_item: 'Software Licenses', category: 'it_assets', description: 'Transfer or revoke software licenses', order_index: 4, priority: 'medium' },
        
        // Access Revocation
        { checklist_item: 'Email Access', category: 'access_revocation', description: 'Disable email account access', order_index: 5, priority: 'high' },
        { checklist_item: 'System Access', category: 'access_revocation', description: 'Revoke all system and application access', order_index: 6, priority: 'high' },
        { checklist_item: 'Physical Access', category: 'access_revocation', description: 'Revoke building and parking access', order_index: 7, priority: 'high' },
        { checklist_item: 'Third-party Access', category: 'access_revocation', description: 'Revoke third-party service access', order_index: 8, priority: 'medium' },
        
        // HR Procedures
        { checklist_item: 'Exit Interview', category: 'hr_procedures', description: 'Conduct exit interview', order_index: 9, priority: 'high' },
        { checklist_item: 'Final Payroll', category: 'hr_procedures', description: 'Process final payroll', order_index: 10, priority: 'high' },
        { checklist_item: 'Benefits Termination', category: 'hr_procedures', description: 'Terminate employee benefits', order_index: 11, priority: 'medium' },
        { checklist_item: 'Reference Letter', category: 'hr_procedures', description: 'Prepare reference letter if requested', order_index: 12, priority: 'low' },
        
        // Knowledge Transfer
        { checklist_item: 'Document Handover', category: 'knowledge_transfer', description: 'Transfer important documents and files', order_index: 13, priority: 'high' },
        { checklist_item: 'Project Handover', category: 'knowledge_transfer', description: 'Hand over ongoing projects', order_index: 14, priority: 'high' },
        { checklist_item: 'Client Handover', category: 'knowledge_transfer', description: 'Transfer client relationships', order_index: 15, priority: 'medium' },
        { checklist_item: 'Training Replacement', category: 'knowledge_transfer', description: 'Train replacement employee', order_index: 16, priority: 'medium' }
      ];

      // Insert checklist items
      const checklistItems = defaultChecklist.map(item => ({
        ...item,
        offboarding_id: offboardingRecord.id,
        assigned_to: offboardingData.assigned_to || null,
        due_date: offboardingData.due_date || null
      }));

      const { error: checklistError } = await supabase
        .from('employee_offboarding_checklist')
        .insert(checklistItems);

      if (checklistError) throw checklistError;

      return offboardingRecord;
    },

    // Complete offboarding process
    completeOffboarding: async (recordId) => {
      const { data, error } = await supabase
        .from('employee_offboarding_records')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== OFFBOARDING CHECKLIST ====================
  offboardingChecklist: {
    getByOffboardingId: async (offboardingId) => {
      const { data, error } = await supabase
        .from('employee_offboarding_checklist')
        .select(`
          *,
          assigned_to_employee:employees!assigned_to_fkey(full_name, email),
          completed_by_employee:employees!completed_by_fkey(full_name, email)
        `)
        .eq('offboarding_id', offboardingId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },

    markComplete: async (itemId, completedBy, notes = '') => {
      const { data, error } = await supabase
        .from('employee_offboarding_checklist')
        .update({
          is_completed: true,
          completed_by: completedBy,
          completed_at: new Date().toISOString(),
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    markIncomplete: async (itemId) => {
      const { data, error } = await supabase
        .from('employee_offboarding_checklist')
        .update({
          is_completed: false,
          completed_by: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateItem: async (itemId, updates) => {
      const { data, error } = await supabase
        .from('employee_offboarding_checklist')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    addCustomItem: async (itemData) => {
      const { data, error } = await supabase
        .from('employee_offboarding_checklist')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== ASSET TRACKING ====================
  assetTracking: {
    getByOffboardingId: async (offboardingId) => {
      const { data, error } = await supabase
        .from('employee_asset_tracking')
        .select('*')
        .eq('offboarding_id', offboardingId)
        .order('asset_type', { ascending: true });

      if (error) throw error;
      return data;
    },

    addAsset: async (assetData) => {
      const { data, error } = await supabase
        .from('employee_asset_tracking')
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateAsset: async (assetId, updates) => {
      const { data, error } = await supabase
        .from('employee_asset_tracking')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', assetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    deleteAsset: async (assetId) => {
      const { error } = await supabase
        .from('employee_asset_tracking')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    }
  },

  // ==================== ACCESS REVOCATION ====================
  accessRevocation: {
    getByOffboardingId: async (offboardingId) => {
      const { data, error } = await supabase
        .from('employee_access_revocation')
        .select(`
          *,
          revoked_by_employee:employees!revoked_by_fkey(full_name, email)
        `)
        .eq('offboarding_id', offboardingId)
        .order('access_type', { ascending: true });

      if (error) throw error;
      return data;
    },

    addAccess: async (accessData) => {
      const { data, error } = await supabase
        .from('employee_access_revocation')
        .insert(accessData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateAccess: async (accessId, updates) => {
      const { data, error } = await supabase
        .from('employee_access_revocation')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', accessId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    deleteAccess: async (accessId) => {
      const { error } = await supabase
        .from('employee_access_revocation')
        .delete()
        .eq('id', accessId);

      if (error) throw error;
    }
  },

  // ==================== DOCUMENTS ====================
  documents: {
    getByEmployeeId: async (employeeId, documentType = null) => {
      let query = supabase
        .from('employee_documents')
        .select(`
          *,
          uploaded_by_employee:employees!uploaded_by_fkey(full_name, email)
        `)
        .eq('employee_id', employeeId);

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    upload: async (documentData) => {
      const { data, error } = await supabase
        .from('employee_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (documentId) => {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    }
  },

  // ==================== COMMENTS ====================
  comments: {
    getByEmployeeId: async (employeeId, processType) => {
      const { data, error } = await supabase
        .from('employee_process_comments')
        .select(`
          *,
          created_by_employee:employees!created_by_fkey(full_name, email)
        `)
        .eq('employee_id', employeeId)
        .eq('process_type', processType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    add: async (commentData) => {
      const { data, error } = await supabase
        .from('employee_process_comments')
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== UTILITY FUNCTIONS ====================
  utils: {
    // Get employees for dropdowns
    getEmployeesForDropdown: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, department, position')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data;
    },

    // Get departments
    getDepartments: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department')
        .not('department', 'is', null)
        .neq('department', '');

      if (error) throw error;
      
      // Get unique departments
      const departments = [...new Set(data.map(emp => emp.department))];
      return departments.sort();
    },

    // Get statistics
    getOnboardingStats: async () => {
      const { data, error } = await supabase
        .from('onboarding_dashboard')
        .select('status, status_indicator');

      if (error) throw error;
      
      const stats = {
        total: data.length,
        completed: data.filter(d => d.status === 'completed').length,
        inProgress: data.filter(d => d.status === 'in_progress').length,
        overdue: data.filter(d => d.status_indicator === 'Overdue').length,
        dueSoon: data.filter(d => d.status_indicator === 'Due Soon').length
      };

      return stats;
    },

    getOffboardingStats: async () => {
      const { data, error } = await supabase
        .from('offboarding_dashboard')
        .select('status, status_indicator');

      if (error) throw error;
      
      const stats = {
        total: data.length,
        completed: data.filter(d => d.status === 'completed').length,
        inProgress: data.filter(d => d.status === 'in_progress').length,
        overdue: data.filter(d => d.status_indicator === 'Overdue').length,
        dueSoon: data.filter(d => d.status_indicator === 'Due Soon').length
      };

      return stats;
    }
  }
};

export default onboardingOffboardingApi;

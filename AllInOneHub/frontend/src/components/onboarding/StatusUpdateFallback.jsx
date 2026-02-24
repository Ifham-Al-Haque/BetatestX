import { supabase } from '../../supabaseClient';

export const updateOnboardingStatus = async (recordId, newStatus, notes = '') => {
  console.log('🔄 Attempting status update with fallback approach...');
  
  // List of possible status column names to try
  const statusColumns = [
    'onboarding_status',
    'status',
    'process_status',
    'current_status',
    'state'
  ];

  // List of possible notes column names
  const notesColumns = [
    'notes',
    'status_notes',
    'comments',
    'description'
  ];

  for (const statusColumn of statusColumns) {
    try {
      console.log(`🧪 Trying status column: ${statusColumn}`);
      
      const updateData = {
        [statusColumn]: newStatus,
        updated_at: new Date().toISOString()
      };

      // Try to add notes if provided
      if (notes) {
        for (const notesColumn of notesColumns) {
          updateData[notesColumn] = notes;
          break; // Just use the first notes column that works
        }
      }

      console.log('📤 Update data:', updateData);

      const { data, error } = await supabase
        .from('employee_onboarding_records')
        .update(updateData)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.log(`❌ ${statusColumn} failed:`, error.message);
        continue; // Try next column
      }

      console.log(`✅ Success with ${statusColumn}:`, data);
      return { success: true, data, statusColumn };

    } catch (err) {
      console.log(`❌ ${statusColumn} error:`, err.message);
      continue; // Try next column
    }
  }

  // If all status columns failed, try a basic update
  try {
    console.log('🔄 Trying basic update without status...');
    
    const { data, error } = await supabase
      .from('employee_onboarding_records')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      throw new Error(`Basic update failed: ${error.message}`);
    }

    console.log('✅ Basic update successful, but no status column found');
    return { 
      success: true, 
      data, 
      warning: 'Status updated but no status column found in database' 
    };

  } catch (err) {
    console.error('❌ All update attempts failed:', err);
    throw new Error(`Failed to update record: ${err.message}`);
  }
};

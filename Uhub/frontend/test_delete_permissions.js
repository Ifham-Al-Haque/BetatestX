// Test script to check IT request deletion permissions
// Run this in the browser console to debug deletion issues

import { supabase } from './src/supabaseClient.js';

async function testDeletePermissions() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    
    console.log('Current user:', user);
    
    // Check user's role in employees table
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, role, department')
      .eq('id', user.id)
      .single();
    
    if (empError) {
      console.log('Employee record not found:', empError);
    } else {
      console.log('Employee record:', employee);
    }
    
    // Try to get a sample IT request
    const { data: requests, error: reqError } = await supabase
      .from('it_requests')
      .select('id, title, requester_id, created_at')
      .limit(1);
    
    if (reqError) {
      console.log('Error fetching requests:', reqError);
    } else {
      console.log('Sample request:', requests[0]);
      
      if (requests[0]) {
        // Check if user can delete this request
        const { data: deleteTest, error: deleteError } = await supabase
          .from('it_requests')
          .delete()
          .eq('id', requests[0].id)
          .select();
        
        if (deleteError) {
          console.log('Delete test failed:', deleteError);
        } else {
          console.log('Delete test result:', deleteTest);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDeletePermissions();

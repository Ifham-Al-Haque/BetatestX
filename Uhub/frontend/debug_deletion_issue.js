// Debug script to troubleshoot IT request deletion issues
// Run this in the browser console to check deletion permissions

import { supabase } from './src/supabaseClient.js';

async function debugDeletionIssue() {
  try {
    console.log('🔍 Starting deletion debug...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    
    console.log('👤 Current user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // Check user in users table (Uhub application accounts)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (userError) {
      console.log('❌ User not found in users table:', userError);
    } else {
      console.log('✅ User found in users table (Uhub account):', userData);
      
      // Check linked employee record
      if (userData.employee_id) {
        const { data: employeeData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', userData.employee_id)
          .single();
        
        if (empError) {
          console.log('❌ Linked employee not found:', empError);
        } else {
          console.log('✅ Linked employee record:', employeeData);
        }
      } else {
        console.log('⚠️ No employee_id linked in users table');
      }
    }
    
    // Check if user exists directly in employees table (fallback)
    const { data: directEmployeeData, error: directEmpError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (directEmpError) {
      console.log('❌ User not found directly in employees table:', directEmpError);
    } else {
      console.log('✅ User found directly in employees table:', directEmployeeData);
    }
    
    // Get a sample IT request
    const { data: requests, error: reqError } = await supabase
      .from('it_requests')
      .select('id, title, requester_id, status, created_at')
      .limit(1);
    
    if (reqError) {
      console.log('❌ Error fetching requests:', reqError);
      return;
    }
    
    if (requests.length === 0) {
      console.log('❌ No IT requests found');
      return;
    }
    
    const sampleRequest = requests[0];
    console.log('📋 Sample request:', sampleRequest);
    
    // Check if user can delete this request
    console.log('🔍 Checking deletion permissions...');
    
    // Check RLS policies
    const { data: canDelete, error: checkError } = await supabase
      .rpc('can_delete_it_request', { request_id: sampleRequest.id });
    
    if (checkError) {
      console.log('❌ Permission check failed:', checkError);
    } else {
      console.log('✅ Permission check result:', canDelete);
    }
    
    // Try to delete the request
    console.log('🗑️ Attempting to delete request...');
    const { data: deleteResult, error: deleteError } = await supabase
      .from('it_requests')
      .delete()
      .eq('id', sampleRequest.id)
      .select();
    
    if (deleteError) {
      console.log('❌ Delete failed:', deleteError);
    } else {
      console.log('✅ Delete successful:', deleteResult);
    }
    
    // Check current RLS policies
    console.log('🔍 Checking current RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'it_requests')
      .eq('cmd', 'DELETE');
    
    if (policyError) {
      console.log('❌ Error fetching policies:', policyError);
    } else {
      console.log('📋 Current DELETE policies:', policies);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug function
debugDeletionIssue();

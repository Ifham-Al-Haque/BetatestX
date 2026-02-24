import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const debugOnboardingTable = async () => {
  try {
    console.log('🔍 Debugging onboarding table structure...');
    
    // Check if table exists and get its structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'employee_onboarding_records')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error fetching table structure:', columnsError);
      return { error: columnsError.message };
    }

    console.log('📋 Available columns in employee_onboarding_records:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });

    // Check for status-related columns
    const statusColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('status') ||
      col.column_name.toLowerCase().includes('state')
    );

    console.log('🎯 Status-related columns found:', statusColumns);

    // Try to get a sample record to see what fields are actually populated
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('employee_onboarding_records')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.log('⚠️ No sample records found or error:', sampleError.message);
    } else {
      console.log('📄 Sample record structure:', Object.keys(sampleRecord));
      console.log('📄 Sample record data:', sampleRecord);
    }

    return {
      columns: columns.map(col => col.column_name),
      statusColumns: statusColumns.map(col => col.column_name),
      sampleRecord: sampleRecord ? Object.keys(sampleRecord) : null
    };

  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
};

export const testStatusUpdate = async (recordId, newStatus) => {
  try {
    console.log('🧪 Testing status update...');
    
    // First, let's see what the current record looks like
    const { data: currentRecord, error: fetchError } = await supabase
      .from('employee_onboarding_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current record:', fetchError);
      return { error: fetchError.message };
    }

    console.log('📄 Current record:', currentRecord);

    // Try to update with minimal data first
    const { data: updateResult, error: updateError } = await supabase
      .from('employee_onboarding_records')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Basic update failed:', updateError);
      return { error: updateError.message };
    }

    console.log('✅ Basic update successful');

    // Now try with status field
    const { data: statusResult, error: statusError } = await supabase
      .from('employee_onboarding_records')
      .update({
        onboarding_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single();

    if (statusError) {
      console.error('❌ Status update failed:', statusError);
      return { error: statusError.message };
    }

    console.log('✅ Status update successful:', statusResult);
    return { success: true, data: statusResult };

  } catch (error) {
    console.error('❌ Test error:', error);
    return { error: error.message };
  }
};

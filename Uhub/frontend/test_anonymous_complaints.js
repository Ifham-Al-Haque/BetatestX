// Test Script for Anonymous Complaints Functionality
// This script tests that anonymous complaints properly hide user identity

import { supabase } from './src/supabaseClient.js';

const testAnonymousComplaints = async () => {
  console.log('🧪 Starting Anonymous Complaints Test...\n');

  try {
    // Test 1: Create an anonymous complaint directly in the database
    console.log('Test 1: Creating anonymous complaint via database...');
    const { data: anonymousComplaint, error: createError } = await supabase
      .from('complaints')
      .insert({
        title: 'Test Anonymous Complaint',
        description: 'This is a test anonymous complaint to verify functionality',
        category: 'Work Environment',
        priority: 'medium',
        status: 'open',
        anonymous: true,
        complainant_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for test
        complainant_name: 'John Doe', // This should be overridden to 'Anonymous'
        complainant_email: 'john@example.com', // This should be set to null
        complainant_department: 'IT' // This should be set to null
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating anonymous complaint:', createError);
      return;
    }

    console.log('✅ Anonymous complaint created successfully');
    console.log('📊 Result:', {
      id: anonymousComplaint.id,
      title: anonymousComplaint.title,
      anonymous: anonymousComplaint.anonymous,
      complainant_name: anonymousComplaint.complainant_name,
      complainant_email: anonymousComplaint.complainant_email,
      complainant_department: anonymousComplaint.complainant_department
    });

    // Verify the trigger worked
    if (anonymousComplaint.complainant_name === 'Anonymous') {
      console.log('✅ Database trigger working: complainant_name set to "Anonymous"');
    } else {
      console.log('❌ Database trigger NOT working: complainant_name is still:', anonymousComplaint.complainant_name);
    }

    // Test 2: Create a non-anonymous complaint for comparison
    console.log('\nTest 2: Creating non-anonymous complaint for comparison...');
    const { data: regularComplaint, error: regularError } = await supabase
      .from('complaints')
      .insert({
        title: 'Test Regular Complaint',
        description: 'This is a test regular complaint for comparison',
        category: 'Work Environment',
        priority: 'medium',
        status: 'open',
        anonymous: false,
        complainant_id: '00000000-0000-0000-0000-000000000001', // Different dummy UUID
        complainant_name: 'Jane Smith',
        complainant_email: 'jane@example.com',
        complainant_department: 'HR'
      })
      .select()
      .single();

    if (regularError) {
      console.error('❌ Error creating regular complaint:', regularError);
    } else {
      console.log('✅ Regular complaint created successfully');
      console.log('📊 Result:', {
        id: regularComplaint.id,
        title: regularComplaint.title,
        anonymous: regularComplaint.anonymous,
        complainant_name: regularComplaint.complainant_name,
        complainant_email: regularComplaint.complainant_email,
        complainant_department: regularComplaint.complainant_department
      });

      if (regularComplaint.complainant_name === 'Jane Smith') {
        console.log('✅ Non-anonymous complaint preserves original name');
      } else {
        console.log('❌ Non-anonymous complaint name was changed unexpectedly:', regularComplaint.complainant_name);
      }
    }

    // Test 3: Update an existing complaint to anonymous
    console.log('\nTest 3: Updating existing complaint to anonymous...');
    const { data: updatedComplaint, error: updateError } = await supabase
      .from('complaints')
      .update({
        anonymous: true,
        complainant_name: 'Jane Smith' // This should be overridden to 'Anonymous'
      })
      .eq('id', regularComplaint.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating complaint to anonymous:', updateError);
    } else {
      console.log('✅ Complaint updated to anonymous successfully');
      console.log('📊 Result:', {
        id: updatedComplaint.id,
        anonymous: updatedComplaint.anonymous,
        complainant_name: updatedComplaint.complainant_name,
        complainant_email: updatedComplaint.complainant_email,
        complainant_department: updatedComplaint.complainant_department
      });

      if (updatedComplaint.complainant_name === 'Anonymous') {
        console.log('✅ Update trigger working: name changed to "Anonymous"');
      } else {
        console.log('❌ Update trigger NOT working: name is still:', updatedComplaint.complainant_name);
      }
    }

    // Test 4: Query all test complaints
    console.log('\nTest 4: Querying all test complaints...');
    const { data: allComplaints, error: queryError } = await supabase
      .from('complaints')
      .select('*')
      .or(`title.eq.Test Anonymous Complaint,title.eq.Test Regular Complaint`)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('❌ Error querying complaints:', queryError);
    } else {
      console.log('✅ Successfully queried test complaints');
      console.log('📊 All test complaints:');
      allComplaints.forEach(complaint => {
        console.log(`  - ${complaint.title}: anonymous=${complaint.anonymous}, name="${complaint.complainant_name}"`);
      });
    }

    // Clean up test data
    console.log('\nCleaning up test data...');
    const { error: deleteError } = await supabase
      .from('complaints')
      .delete()
      .or(`title.eq.Test Anonymous Complaint,title.eq.Test Regular Complaint`);

    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n🎉 Anonymous Complaints Test Completed!');
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log('- Database trigger should automatically set complainant_name to "Anonymous" when anonymous=true');
    console.log('- Frontend API should handle anonymous complaints by setting name to "Anonymous"');
    console.log('- Anonymous complaints should have null values for email and department');
    console.log('- Non-anonymous complaints should preserve original user information');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testAnonymousComplaints();

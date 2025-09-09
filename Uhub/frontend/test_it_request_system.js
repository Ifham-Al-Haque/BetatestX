// Test IT Request System
// This script tests the IT Request system functionality

import { itServicesApi } from './src/services/itServicesApi.js';

const testITRequestSystem = async () => {
  console.log('🧪 Testing IT Request System...\n');

  try {
    // Test 1: Fetch categories
    console.log('1. Testing categories...');
    const categories = await itServicesApi.categories.getAll();
    console.log(`✅ Categories loaded: ${categories.length} items`);
    console.log('   Sample categories:', categories.slice(0, 3).map(c => c.name));

    // Test 2: Fetch priorities
    console.log('\n2. Testing priorities...');
    const priorities = await itServicesApi.priorities.getAll();
    console.log(`✅ Priorities loaded: ${priorities.length} items`);
    console.log('   Sample priorities:', priorities.slice(0, 3).map(p => p.name));

    // Test 3: Fetch requests
    console.log('\n3. Testing requests...');
    const requests = await itServicesApi.requests.getAll({}, null, null);
    console.log(`✅ Requests loaded: ${requests.data.length} items`);
    if (requests.data.length > 0) {
      console.log('   Sample request:', {
        title: requests.data[0].title,
        status: requests.data[0].status,
        category: requests.data[0].category_name || 'N/A'
      });
    }

    // Test 4: Fetch statistics
    console.log('\n4. Testing statistics...');
    const stats = await itServicesApi.requests.getStats(null, null);
    console.log('✅ Statistics loaded:', {
      total: stats.total_requests,
      open: stats.open_requests,
      inProgress: stats.in_progress_requests,
      resolved: stats.resolved_requests
    });

    // Test 5: Test ticket system
    console.log('\n5. Testing tickets...');
    const tickets = await itServicesApi.tickets.getAll({});
    console.log(`✅ Tickets loaded: ${tickets.data.length} items`);

    console.log('\n🎉 All tests passed! IT Request system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide helpful error messages
    if (error.message.includes('relation "it_request_categories" does not exist')) {
      console.log('\n💡 Solution: Run the database setup script:');
      console.log('   Execute: fix_it_request_database.sql in your Supabase SQL editor');
    } else if (error.message.includes('permission denied')) {
      console.log('\n💡 Solution: Check your RLS policies and user permissions');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Solution: Check your Supabase connection and API keys');
    }
  }
};

// Run the test
testITRequestSystem();

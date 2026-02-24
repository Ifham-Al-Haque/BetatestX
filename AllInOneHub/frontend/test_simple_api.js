// Simple test for IT Request API without user joins
// Run this in browser console

import { itServicesApi } from './src/services/itServicesApi.js';

const testSimpleAPI = async () => {
  console.log('🧪 Testing Simple IT Request API...\n');

  try {
    // Test 1: Categories
    console.log('1. Testing categories...');
    const categories = await itServicesApi.categories.getAll();
    console.log(`✅ Categories: ${categories.length} items`);
    console.log('   Sample:', categories.slice(0, 2).map(c => c.name));

    // Test 2: Priorities
    console.log('\n2. Testing priorities...');
    const priorities = await itServicesApi.priorities.getAll();
    console.log(`✅ Priorities: ${priorities.length} items`);
    console.log('   Sample:', priorities.slice(0, 2).map(p => p.name));

    // Test 3: Requests (should work now without user joins)
    console.log('\n3. Testing requests...');
    const requests = await itServicesApi.requests.getAll({}, null, null);
    console.log(`✅ Requests: ${requests.data.length} items`);
    
    if (requests.data.length > 0) {
      console.log('   Sample request:', {
        title: requests.data[0].title,
        status: requests.data[0].status,
        category: requests.data[0].category?.name || 'N/A',
        priority: requests.data[0].priority?.name || 'N/A'
      });
    } else {
      console.log('   ℹ️ No requests found (this is normal for a new system)');
    }

    // Test 4: Stats
    console.log('\n4. Testing statistics...');
    const stats = await itServicesApi.requests.getStats(null, null);
    console.log('✅ Statistics:', {
      total: stats.total_requests,
      open: stats.open_requests,
      inProgress: stats.in_progress_requests,
      resolved: stats.resolved_requests
    });

    console.log('\n🎉 All tests passed! API is working without user joins.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
  }
};

// Run the test
testSimpleAPI();

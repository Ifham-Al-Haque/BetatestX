// Test IT Request API with Sample Data
// Run this in browser console to test the API

import { itServicesApi } from './src/services/itServicesApi.js';

const testAPIWithData = async () => {
  console.log('🧪 Testing IT Request API with sample data...\n');

  try {
    // Test 1: Fetch categories
    console.log('1. Testing categories...');
    const categories = await itServicesApi.categories.getAll();
    console.log(`✅ Categories: ${categories.length} items`);
    console.log('   Sample:', categories.slice(0, 2).map(c => c.name));

    // Test 2: Fetch priorities
    console.log('\n2. Testing priorities...');
    const priorities = await itServicesApi.priorities.getAll();
    console.log(`✅ Priorities: ${priorities.length} items`);
    console.log('   Sample:', priorities.slice(0, 2).map(p => p.name));

    // Test 3: Fetch requests
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
      console.log('   ⚠️ No requests found - run the sample data script');
    }

    // Test 4: Fetch statistics
    console.log('\n4. Testing statistics...');
    const stats = await itServicesApi.requests.getStats(null, null);
    console.log('✅ Statistics:', {
      total: stats.total_requests,
      open: stats.open_requests,
      inProgress: stats.in_progress_requests,
      resolved: stats.resolved_requests
    });

    // Test 5: Test filtering
    console.log('\n5. Testing filters...');
    const openRequests = await itServicesApi.requests.getAll({ status: 'open' }, null, null);
    console.log(`✅ Open requests: ${openRequests.data.length} items`);

    console.log('\n🎉 All tests passed! IT Request system is working with data.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Details:', error);
  }
};

// Run the test
testAPIWithData();

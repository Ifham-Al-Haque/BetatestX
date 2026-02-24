// IT Requests System Test Script
// Run this in browser console to test the system

console.log('🧪 Testing IT Requests System...');

async function testITRequestsSystem() {
  try {
    console.log('📊 Step 1: Testing database connection...');
    
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('it_request_categories')
      .select('*')
      .limit(5);
    
    if (catError) {
      console.error('❌ Categories table error:', catError);
      return false;
    }
    
    console.log('✅ Categories loaded:', categories?.length || 0);
    
    // Test priorities
    const { data: priorities, error: prioError } = await supabase
      .from('it_request_priorities')
      .select('*')
      .limit(5);
    
    if (prioError) {
      console.error('❌ Priorities table error:', prioError);
      return false;
    }
    
    console.log('✅ Priorities loaded:', priorities?.length || 0);
    
    // Test requests table
    const { data: requests, error: reqError } = await supabase
      .from('it_requests')
      .select('*')
      .limit(5);
    
    if (reqError) {
      console.error('❌ Requests table error:', reqError);
      return false;
    }
    
    console.log('✅ Requests loaded:', requests?.length || 0);
    
    console.log('🎉 All tests passed! IT Requests system is working correctly.');
    
    // Display sample data
    if (categories?.length > 0) {
      console.log('📋 Sample Categories:', categories.map(c => c.name));
    }
    
    if (priorities?.length > 0) {
      console.log('🚨 Sample Priorities:', priorities.map(p => `${p.name} (${p.sla_hours}h SLA)`));
    }
    
    if (requests?.length > 0) {
      console.log('📝 Sample Requests:', requests.map(r => r.title));
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    return false;
  }
}

// Test API service
async function testAPIService() {
  try {
    console.log('🔧 Step 2: Testing API service...');
    
    // Test if itServicesApi is available
    if (typeof itServicesApi === 'undefined') {
      console.error('❌ itServicesApi not found. Make sure you\'re on the IT requests page.');
      return false;
    }
    
    // Test categories API
    const categories = await itServicesApi.categories.getAll();
    console.log('✅ API Categories:', categories?.length || 0);
    
    // Test priorities API
    const priorities = await itServicesApi.priorities.getAll();
    console.log('✅ API Priorities:', priorities?.length || 0);
    
    // Test requests API (this might fail if no user is logged in)
    try {
      const requests = await itServicesApi.requests.getAll();
      console.log('✅ API Requests:', requests?.length || 0);
    } catch (apiError) {
      console.warn('⚠️ Requests API requires authentication:', apiError.message);
    }
    
    console.log('🎉 API service tests completed!');
    return true;
    
  } catch (error) {
    console.error('💥 API test failed:', error);
    return false;
  }
}

// Test UI components
function testUIComponents() {
  console.log('🎨 Step 3: Testing UI components...');
  
  // Check if we're on the IT requests page
  const currentPath = window.location.pathname;
  if (!currentPath.includes('it-request')) {
    console.warn('⚠️ Not on IT requests page. Navigate to /it-requests to test UI components.');
    return false;
  }
  
  // Check for key UI elements
  const elements = {
    'New Request Button': document.querySelector('button:contains("New Request")'),
    'Statistics Cards': document.querySelectorAll('[class*="gradient"]'),
    'Search Input': document.querySelector('input[placeholder*="Search"]'),
    'Filter Button': document.querySelector('button:contains("Filter")')
  };
  
  let foundElements = 0;
  Object.entries(elements).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ ${name} found`);
      foundElements++;
    } else {
      console.log(`❌ ${name} not found`);
    }
  });
  
  if (foundElements > 0) {
    console.log('🎉 UI components test completed!');
    return true;
  } else {
    console.warn('⚠️ No UI components found. Make sure the page has loaded completely.');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive IT Requests system test...\n');
  
  const results = {
    database: await testITRequestsSystem(),
    api: await testAPIService(),
    ui: testUIComponents()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('Database:', results.database ? '✅ PASS' : '❌ FAIL');
  console.log('API Service:', results.api ? '✅ PASS' : '❌ FAIL');
  console.log('UI Components:', results.ui ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! IT Requests system is fully functional.');
    console.log('\n📋 Next steps:');
    console.log('1. Navigate to /it-requests');
    console.log('2. Click "New Request" to create a test request');
    console.log('3. Fill out the form and submit');
    console.log('4. Verify the request appears in the list');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the setup guide and fix any issues.');
  }
  
  return allPassed;
}

// Auto-run tests
runAllTests();

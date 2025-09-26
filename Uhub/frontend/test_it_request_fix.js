// Test IT Request System Fix
// Run this in browser console to test the IT Request functionality

console.log('🔧 Testing IT Request System...');

// Test the itServicesApi methods
const testITRequestSystem = async () => {
  try {
    console.log('📋 Testing IT Services API...');
    
    // Test categories
    console.log('1. Testing categories...');
    const categories = await itServicesApi.categories.getAll();
    console.log('✅ Categories loaded:', categories?.length || 0);
    
    // Test priorities  
    console.log('2. Testing priorities...');
    const priorities = await itServicesApi.priorities.getAll();
    console.log('✅ Priorities loaded:', priorities?.length || 0);
    
    // Test requests.getAll
    console.log('3. Testing requests.getAll...');
    const allRequests = await itServicesApi.requests.getAll();
    console.log('✅ All requests loaded:', allRequests?.data?.length || 0);
    
    // Test requests.getAllForTech (the one that was failing)
    console.log('4. Testing requests.getAllForTech...');
    const techRequests = await itServicesApi.requests.getAllForTech();
    console.log('✅ Tech requests loaded:', techRequests?.length || 0);
    
    // Test requests.getStats
    console.log('5. Testing requests.getStats...');
    const stats = await itServicesApi.requests.getStats();
    console.log('✅ Stats loaded:', stats);
    
    console.log('🎉 All IT Request API tests passed!');
    
    return {
      categories: categories?.length || 0,
      priorities: priorities?.length || 0,
      allRequests: allRequests?.data?.length || 0,
      techRequests: techRequests?.length || 0,
      stats: stats
    };
    
  } catch (error) {
    console.error('❌ IT Request test failed:', error);
    throw error;
  }
};

// Test database tables existence
const testDatabaseTables = async () => {
  try {
    console.log('🗄️ Testing database tables...');
    
    // Test it_requests table
    const { data: requests, error: requestsError } = await supabase
      .from('it_requests')
      .select('id, title, status')
      .limit(1);
    
    if (requestsError) {
      console.error('❌ it_requests table issue:', requestsError);
    } else {
      console.log('✅ it_requests table accessible');
    }
    
    // Test it_request_categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('it_request_categories')
      .select('id, name')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ it_request_categories table issue:', categoriesError);
    } else {
      console.log('✅ it_request_categories table accessible');
    }
    
    // Test it_request_priorities table
    const { data: priorities, error: prioritiesError } = await supabase
      .from('it_request_priorities')
      .select('id, name')
      .limit(1);
    
    if (prioritiesError) {
      console.error('❌ it_request_priorities table issue:', prioritiesError);
    } else {
      console.log('✅ it_request_priorities table accessible');
    }
    
    console.log('✅ Database table tests completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
};

// Run tests
console.log('🚀 Starting IT Request System Tests...');
testDatabaseTables().then(() => {
  return testITRequestSystem();
}).then((results) => {
  console.log('🎉 All tests completed successfully!', results);
}).catch((error) => {
  console.error('❌ Tests failed:', error);
  console.log('💡 Suggestion: Check if IT Request database tables exist and are properly configured');
});

// Export for manual testing
window.testITRequestSystem = testITRequestSystem;
window.testDatabaseTables = testDatabaseTables;

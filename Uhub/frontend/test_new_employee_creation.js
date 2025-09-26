// Test New Employee Creation - Run in Browser Console
// This script tests the new employee creation without optional fields like address

console.log('🧪 Testing New Employee Creation...');

async function testNewEmployeeCreation() {
  try {
    console.log('📋 Step 1: Testing employee creation with minimal required data...');
    
    // Test data with only required fields
    const testEmployeeData = {
      full_name: 'Test Employee',
      employee_id: 'EMP24120TEST',
      email: 'test.employee@udrive.com',
      phone: '+1234567890',
      position: 'Test Position',
      department: 'IT',
      start_date: '2024-12-01',
      employment_type: 'full_time'
    };

    console.log('📝 Test employee data:', testEmployeeData);

    // Test the API call
    const result = await onboardingOffboardingApi.employees.create(testEmployeeData);
    
    console.log('✅ SUCCESS: Employee created without address field!');
    console.log('📊 Created employee:', result);
    
    // Clean up test data
    if (result?.id) {
      await supabase
        .from('employees')
        .delete()
        .eq('id', result.id);
      console.log('🧹 Test employee cleaned up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('address')) {
      console.log('💡 Solution: Address field removed from creation process');
    }
    
    return false;
  }
}

async function testDatabaseSchema() {
  try {
    console.log('🔍 Step 2: Testing database schema compatibility...');
    
    // Test if we can query employees table
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Database access error:', error);
      return false;
    }
    
    console.log('✅ Database access working');
    
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('it_request_categories')
      .select('*')
      .limit(1);
    
    if (catError) {
      console.warn('⚠️ Categories table issue:', catError);
    } else {
      console.log('✅ Categories table accessible');
    }
    
    // Test priorities
    const { data: priorities, error: prioError } = await supabase
      .from('it_request_priorities')
      .select('*')
      .limit(1);
    
    if (prioError) {
      console.warn('⚠️ Priorities table issue:', prioError);
    } else {
      console.log('✅ Priorities table accessible');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
    return false;
  }
}

async function testOnboardingFlow() {
  try {
    console.log('🚀 Step 3: Testing complete onboarding flow...');
    
    // Check if onboarding API is available
    if (typeof onboardingOffboardingApi === 'undefined') {
      console.error('❌ onboardingOffboardingApi not found. Make sure you\'re on the onboarding page.');
      return false;
    }
    
    // Test templates
    const templates = await onboardingOffboardingApi.templates.getAll();
    console.log('📋 Templates available:', templates?.length || 0);
    
    // Test getting employees for dropdown (should work even if empty)
    try {
      const employees = await onboardingOffboardingApi.employees.getAll();
      console.log('👥 Existing employees:', employees?.length || 0);
    } catch (empError) {
      console.log('ℹ️ Employees table empty or not accessible (this is OK for new system)');
    }
    
    console.log('✅ Onboarding flow components working');
    return true;
    
  } catch (error) {
    console.error('❌ Onboarding flow test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting New Employee Creation Tests...\n');
  
  const results = {
    employeeCreation: await testNewEmployeeCreation(),
    databaseSchema: await testDatabaseSchema(),
    onboardingFlow: await testOnboardingFlow()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('Employee Creation:', results.employeeCreation ? '✅ PASS' : '❌ FAIL');
  console.log('Database Schema:', results.databaseSchema ? '✅ PASS' : '❌ FAIL');
  console.log('Onboarding Flow:', results.onboardingFlow ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! New employee creation system is working.');
    console.log('\n📋 Next steps:');
    console.log('1. Navigate to Employee Onboarding section');
    console.log('2. Click "Start Onboarding"');
    console.log('3. Fill in new employee details (address is optional)');
    console.log('4. Complete the onboarding setup');
    console.log('5. Submit to create employee and start onboarding');
  } else {
    console.log('\n⚠️ Some tests failed. Check the database setup and try again.');
    
    if (!results.databaseSchema) {
      console.log('\n🔧 Database Fix Needed:');
      console.log('1. Run setup_it_requests_complete.sql in Supabase');
      console.log('2. Run fix_it_requests_simple.sql in Supabase');
      console.log('3. Refresh browser and try again');
    }
  }
  
  return allPassed;
}

// Auto-run tests
runAllTests();

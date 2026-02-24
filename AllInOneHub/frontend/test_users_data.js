// Test script to verify users data is working correctly
// Run this in your browser console or Node.js environment

const testUsersData = async () => {
  try {
    console.log('🧪 Testing Users Data for Task Assignment...');
    
    // Import your API service (adjust the import path as needed)
    const { apiService } = await import('./src/services/api.js');
    
    // Test 1: Fetch users from database
    console.log('\n📊 Test 1: Fetching users from database...');
    const { data: users } = await apiService.userManagement.getAll();
    console.log('Raw users data:', users);
    
    // Test 2: Analyze user data
    console.log('\n📈 Test 2: Analyzing user data...');
    const analysis = {
      total: users.length,
      withDepartments: users.filter(u => u.department && u.department !== 'N/A' && u.department !== '' && u.department !== 'Unassigned').length,
      active: users.filter(u => u.status === 'active').length,
      activeWithDepartments: users.filter(u => u.status === 'active' && u.department && u.department !== 'N/A' && u.department !== '' && u.department !== 'Unassigned').length,
      departments: [...new Set(users.map(u => u.department).filter(d => d && d !== 'N/A' && d !== '' && d !== 'Unassigned'))]
    };
    
    console.log('Analysis results:', analysis);
    
    // Test 3: Filter users by department
    console.log('\n🔍 Test 3: Testing department filtering...');
    const testDepartments = ['TECHNOLOGY', 'OPERATIONS', 'MANAGEMENT', 'HR', 'FINANCE'];
    
    testDepartments.forEach(dept => {
      const filteredUsers = users.filter(user => {
        const userDept = (user.department || '').toString().toUpperCase().trim();
        const selectedDept = dept.toUpperCase().trim();
        const isMatch = userDept === selectedDept || userDept.includes(selectedDept) || selectedDept.includes(userDept);
        const isActive = (user.status || '').toLowerCase() === 'active';
        return isMatch && isActive;
      });
      
      console.log(`${dept}: ${filteredUsers.length} users found`);
      if (filteredUsers.length > 0) {
        console.log(`  Users: ${filteredUsers.map(u => u.full_name || u.email).join(', ')}`);
      }
    });
    
    // Test 4: Check for mock data
    console.log('\n🎭 Test 4: Checking for mock data...');
    const hasMockData = users.some(u => u.email && u.email.includes('@example.com'));
    console.log(`Mock data detected: ${hasMockData ? 'YES' : 'NO'}`);
    
    if (hasMockData) {
      console.log('⚠️  Mock data found - this means real users are not being loaded properly');
    } else {
      console.log('✅ Real user data detected');
    }
    
    // Test 5: Department mapping validation
    console.log('\n🏢 Test 5: Validating department mapping...');
    const expectedDepartments = ['MANAGEMENT', 'HR', 'CUSTOMER_SERVICE', 'OPERATIONS', 'TECHNOLOGY', 'FINANCE', 'MARKETING', 'SUBSCRIBE_NOW_SALES', 'IOT', 'OTHERS'];
    const actualDepartments = [...new Set(users.map(u => u.department).filter(d => d && d !== 'N/A' && d !== '' && d !== 'Unassigned'))];
    
    console.log('Expected departments:', expectedDepartments);
    console.log('Actual departments:', actualDepartments);
    
    const missingDepartments = expectedDepartments.filter(dept => !actualDepartments.includes(dept));
    const extraDepartments = actualDepartments.filter(dept => !expectedDepartments.includes(dept));
    
    if (missingDepartments.length > 0) {
      console.log('❌ Missing departments:', missingDepartments);
    }
    if (extraDepartments.length > 0) {
      console.log('ℹ️  Extra departments:', extraDepartments);
    }
    
    if (missingDepartments.length === 0 && extraDepartments.length === 0) {
      console.log('✅ All expected departments are present');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testUsersData();

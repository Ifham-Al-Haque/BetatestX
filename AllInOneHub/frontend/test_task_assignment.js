// Test script to verify task assignment with real UHub users
// Run this in your browser console

const testTaskAssignment = async () => {
  try {
    console.log('🧪 Testing Task Assignment with Real UHub Users...');
    
    // Import your API service (adjust the import path as needed)
    const { apiService } = await import('./src/services/api.js');
    
    // Test 1: Fetch users from database
    console.log('\n📊 Test 1: Fetching UHub users...');
    const { data: users, error } = await apiService.userManagement.getAll();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log('Raw users data:', users);
    
    // Test 2: Filter active users with departments
    console.log('\n🔍 Test 2: Filtering active users with departments...');
    const activeUsersWithDepts = users.filter(user => {
      const hasValidDepartment = user.department && 
        user.department !== 'N/A' && 
        user.department !== '' && 
        user.department !== 'Unassigned' &&
        user.department !== null;
      
      const isActive = user.status === 'active';
      
      return hasValidDepartment && isActive;
    });
    
    console.log(`Found ${activeUsersWithDepts.length} active users with valid departments`);
    
    // Test 3: Group by department
    console.log('\n🏢 Test 3: Grouping users by department...');
    const usersByDept = {};
    activeUsersWithDepts.forEach(user => {
      const dept = user.department;
      if (!usersByDept[dept]) {
        usersByDept[dept] = [];
      }
      usersByDept[dept].push({
        name: user.full_name || user.email,
        email: user.email,
        role: user.role
      });
    });
    
    Object.keys(usersByDept).forEach(dept => {
      console.log(`${dept}: ${usersByDept[dept].length} users`);
      usersByDept[dept].forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    });
    
    // Test 4: Test department filtering (like in the task modal)
    console.log('\n🎯 Test 4: Testing department filtering...');
    const testDepartments = ['TECHNOLOGY', 'OPERATIONS', 'MANAGEMENT', 'HR', 'FINANCE', 'MARKETING'];
    
    testDepartments.forEach(dept => {
      const filteredUsers = activeUsersWithDepts.filter(user => {
        const userDept = (user.department || '').toString().toUpperCase().trim();
        const selectedDept = dept.toUpperCase().trim();
        return userDept === selectedDept || userDept.includes(selectedDept) || selectedDept.includes(userDept);
      });
      
      console.log(`${dept}: ${filteredUsers.length} users available for task assignment`);
      if (filteredUsers.length > 0) {
        filteredUsers.forEach(user => {
          console.log(`  - ${user.full_name || user.email} (${user.email})`);
        });
      }
    });
    
    // Test 5: Check if this matches your user management interface
    console.log('\n✅ Test 5: Verification against user management interface...');
    console.log('Based on your user management interface, you should see:');
    console.log('- HR Manager (hr@uhub.com) in HR department');
    console.log('- Ifham (ifham@uhub.com) in OPERATIONS department');
    console.log('- Talha (talha@uhub.com) in TECHNOLOGY department');
    console.log('- And other users with their respective departments');
    
    console.log('\n🎉 Test completed! If you see the expected users above, task assignment should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testTaskAssignment();

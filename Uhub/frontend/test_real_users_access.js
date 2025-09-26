// Test Real Users Access for Task Assignment
// Run this in your browser console after running the SQL fix

const testRealUsersAccess = async () => {
  try {
    console.log('🧪 Testing Real Users Access for Task Assignment...');
    
    // Import your API service
    const { apiService } = await import('./src/services/api.js');
    
    // Test 1: Fetch all users
    console.log('\n📡 Test 1: Fetching real users from database...');
    const { data: users, error } = await apiService.userManagement.getAll();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }
    
    console.log('✅ Successfully fetched real users:', users.length);
    
    // Test 2: Show users by department
    console.log('\n🏢 Test 2: Users by department...');
    const departments = [...new Set(users.map(u => u.department).filter(d => d && d !== 'N/A' && d !== ''))];
    console.log('Available departments:', departments);
    
    departments.forEach(dept => {
      const deptUsers = users.filter(u => u.department === dept && u.status === 'active');
      console.log(`\n${dept} (${deptUsers.length} users):`);
      deptUsers.forEach(u => console.log(`  - ${u.full_name} (${u.email}) - ${u.position}`));
    });
    
    // Test 3: Test department filtering (simulate frontend logic)
    console.log('\n🔍 Test 3: Testing department filtering for task assignment...');
    
    const testDepartments = ['TECHNOLOGY', 'HR', 'OPERATIONS', 'MARKETING', 'FINANCE', 'CUSTOMER_SERVICE'];
    
    testDepartments.forEach(dept => {
      console.log(`\nTesting ${dept} department:`);
      const filteredUsers = users.filter(user => {
        const userDept = (user.department || '').toString().toUpperCase().trim();
        const selectedDept = dept.toUpperCase().trim();
        const isMatch = userDept === selectedDept || 
                       userDept.includes(selectedDept) || 
                       selectedDept.includes(userDept);
        const isActive = (user.status || '').toLowerCase() === 'active';
        return isMatch && isActive;
      });
      
      console.log(`  Found ${filteredUsers.length} users:`);
      filteredUsers.forEach(u => console.log(`    - ${u.full_name} (${u.email}) - ${u.position}`));
    });
    
    // Test 4: Simulate task creation with real users
    console.log('\n📝 Test 4: Simulating task creation with real users...');
    
    const technologyUsers = users.filter(u => u.department === 'TECHNOLOGY' && u.status === 'active');
    const hrUsers = users.filter(u => u.department === 'HR' && u.status === 'active');
    
    if (technologyUsers.length > 0) {
      const assignee = technologyUsers[0];
      const assignedBy = users.find(u => u.role === 'admin' && u.status === 'active') || users[0];
      
      console.log(`✅ TECHNOLOGY task assignment test:`);
      console.log(`  Assignee: ${assignee.full_name} (${assignee.email})`);
      console.log(`  Assigned by: ${assignedBy.full_name} (${assignedBy.email})`);
      console.log(`  Department: ${assignee.department}`);
      console.log(`  Position: ${assignee.position}`);
    }
    
    if (hrUsers.length > 0) {
      const assignee = hrUsers[0];
      const assignedBy = users.find(u => u.role === 'admin' && u.status === 'active') || users[0];
      
      console.log(`✅ HR task assignment test:`);
      console.log(`  Assignee: ${assignee.full_name} (${assignee.email})`);
      console.log(`  Assigned by: ${assignedBy.full_name} (${assignedBy.email})`);
      console.log(`  Department: ${assignee.department}`);
      console.log(`  Position: ${assignee.position}`);
    }
    
    console.log('\n🎉 Real users access test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Active users: ${users.filter(u => u.status === 'active').length}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Users with departments: ${users.filter(u => u.department && u.department !== 'N/A' && u.department !== '').length}`);
    
    console.log('\n✅ Your task assignment should now work with real users!');
    console.log('💡 Try opening the "Create New Task" modal and selecting different departments.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('This might be due to:');
    console.log('1. RLS policies still blocking access');
    console.log('2. API service configuration issues');
    console.log('3. Database connection problems');
  }
};

// Run the test
testRealUsersAccess();

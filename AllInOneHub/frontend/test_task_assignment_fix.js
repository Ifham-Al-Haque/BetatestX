// Test script to verify task assignment functionality
// Run this in your browser console after running the SQL script

const testTaskAssignmentFix = async () => {
  try {
    console.log('🧪 Testing Task Assignment Fix...');
    
    // Import your API service
    const { apiService } = await import('./src/services/api.js');
    
    // Test 1: Fetch all users
    console.log('\n📡 Test 1: Fetching all users...');
    const { data: users, error } = await apiService.userManagement.getAll();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log('✅ Successfully fetched users:', users.length);
    
    // Test 2: Check department distribution
    console.log('\n🏢 Test 2: Department distribution...');
    const departments = [...new Set(users.map(u => u.department).filter(d => d && d !== 'N/A' && d !== ''))];
    console.log('Available departments:', departments);
    
    departments.forEach(dept => {
      const deptUsers = users.filter(u => u.department === dept && u.status === 'active');
      console.log(`${dept}: ${deptUsers.length} active users`);
      deptUsers.forEach(u => console.log(`  - ${u.full_name} (${u.email})`));
    });
    
    // Test 3: Test department filtering (simulate the frontend logic)
    console.log('\n🔍 Test 3: Testing department filtering...');
    
    const testDepartments = ['TECHNOLOGY', 'HR', 'OPERATIONS', 'MARKETING'];
    
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
    
    // Test 4: Simulate task creation
    console.log('\n📝 Test 4: Simulating task creation...');
    
    const technologyUsers = users.filter(u => u.department === 'TECHNOLOGY' && u.status === 'active');
    if (technologyUsers.length > 0) {
      const assignee = technologyUsers[0];
      const assignedBy = users.find(u => u.role === 'admin' && u.status === 'active') || users[0];
      
      console.log(`✅ Task assignment test:`);
      console.log(`  Assignee: ${assignee.full_name} (${assignee.email})`);
      console.log(`  Assigned by: ${assignedBy.full_name} (${assignedBy.email})`);
      console.log(`  Department: ${assignee.department}`);
      console.log(`  Position: ${assignee.position}`);
      
      // This would be the task data structure
      const taskData = {
        title: `Test Task for ${assignee.full_name}`,
        description: `This is a test task assigned to ${assignee.full_name} in the ${assignee.department} department.`,
        assigned_to: assignee.id,
        assigned_by: assignedBy.id,
        priority: 'high',
        status: 'pending',
        department: assignee.department,
        category: 'Development',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_hours: 8,
        tags: ['testing', 'uhub']
      };
      
      console.log('📋 Task data structure:', taskData);
    }
    
    console.log('\n🎉 Task assignment fix test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Active users: ${users.filter(u => u.status === 'active').length}`);
    console.log(`- Departments: ${departments.length}`);
    console.log(`- Users with departments: ${users.filter(u => u.department && u.department !== 'N/A' && u.department !== '').length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testTaskAssignmentFix();

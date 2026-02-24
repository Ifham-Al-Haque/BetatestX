// Test Complete Task System
// This script tests both users access and task creation

const testCompleteTaskSystem = async () => {
  try {
    console.log('🧪 Testing Complete Task System...');
    
    // Import services
    const { apiService } = await import('./src/services/api.js');
    const { taskApi } = await import('./src/services/taskApi.js');
    
    // Test 1: Check users access
    console.log('\n👥 Test 1: Testing users access...');
    try {
      const users = await apiService.userManagement.getAll();
      console.log('✅ Users access successful:', users.length, 'users found');
      
      if (users.length > 0) {
        console.log('Sample users:');
        users.slice(0, 5).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.full_name} (${user.email}) - ${user.department}`);
        });
      }
    } catch (error) {
      console.error('❌ Users access failed:', error);
      return;
    }
    
    // Test 2: Check tasks access
    console.log('\n📋 Test 2: Testing tasks access...');
    try {
      const tasks = await taskApi.getAll();
      console.log('✅ Tasks access successful:', tasks.length, 'tasks found');
    } catch (error) {
      console.error('❌ Tasks access failed:', error);
    }
    
    // Test 3: Test task creation
    console.log('\n📝 Test 3: Testing task creation...');
    try {
      const users = await apiService.userManagement.getAll();
      const technologyUsers = users.filter(u => u.department === 'TECHNOLOGY' && u.status === 'active');
      const adminUsers = users.filter(u => u.role === 'admin' && u.status === 'active');
      
      if (technologyUsers.length > 0 && adminUsers.length > 0) {
        const assignee = technologyUsers[0];
        const assignedBy = adminUsers[0];
        
        const testTask = {
          title: `Test Task - ${new Date().toISOString()}`,
          description: 'This is a test task to verify the system is working',
          assigned_to: assignee.id,
          assigned_by: assignedBy.id,
          priority: 'medium',
          status: 'pending',
          department: assignee.department,
          category: 'Testing',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_hours: 2,
          tags: ['test', 'verification']
        };
        
        console.log('Creating test task:', testTask);
        
        const createdTask = await taskApi.create(testTask);
        console.log('✅ Task creation successful:', createdTask);
        
        // Clean up - delete the test task
        try {
          await taskApi.delete(createdTask.id);
          console.log('✅ Test task cleaned up');
        } catch (cleanupError) {
          console.log('⚠️ Could not clean up test task:', cleanupError.message);
        }
        
      } else {
        console.log('⚠️ Not enough users to test task creation');
        console.log('Technology users:', technologyUsers.length);
        console.log('Admin users:', adminUsers.length);
      }
      
    } catch (error) {
      console.error('❌ Task creation failed:', error);
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    
    // Test 4: Test department filtering
    console.log('\n🔍 Test 4: Testing department filtering...');
    try {
      const users = await apiService.userManagement.getAll();
      const departments = [...new Set(users.map(u => u.department).filter(d => d && d !== 'N/A' && d !== ''))];
      
      console.log('Available departments:', departments);
      
      departments.forEach(dept => {
        const deptUsers = users.filter(u => u.department === dept && u.status === 'active');
        console.log(`${dept}: ${deptUsers.length} users`);
      });
      
    } catch (error) {
      console.error('❌ Department filtering failed:', error);
    }
    
    console.log('\n🎉 Complete task system test finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testCompleteTaskSystem();

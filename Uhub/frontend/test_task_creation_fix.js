// Test Task Creation Fix
// Run this after running the SQL fix to test task creation

const testTaskCreationFix = async () => {
  try {
    console.log('🧪 Testing Task Creation Fix...');
    
    // Import services
    const { apiService } = await import('./src/services/api.js');
    const { taskApi } = await import('./src/services/taskApi.js');
    
    // Test 1: Get users
    console.log('\n👥 Test 1: Getting users...');
    const users = await apiService.userManagement.getAll();
    console.log('✅ Users found:', users.length);
    
    if (users.length === 0) {
      console.error('❌ No users found');
      return;
    }
    
    // Test 2: Get existing tasks
    console.log('\n📋 Test 2: Getting existing tasks...');
    try {
      const existingTasks = await taskApi.getAll();
      console.log('✅ Existing tasks:', existingTasks.length);
    } catch (error) {
      console.log('⚠️ Could not get existing tasks:', error.message);
    }
    
    // Test 3: Create a test task with unique title
    console.log('\n📝 Test 3: Creating test task...');
    
    const technologyUsers = users.filter(u => u.department === 'TECHNOLOGY' && u.status === 'active');
    const adminUsers = users.filter(u => u.role === 'admin' && u.status === 'active');
    
    if (technologyUsers.length === 0 || adminUsers.length === 0) {
      console.log('⚠️ Not enough users, using any available users');
      const anyUsers = users.filter(u => u.status === 'active');
      if (anyUsers.length < 2) {
        console.error('❌ Not enough users to test');
        return;
      }
      var assignee = anyUsers[0];
      var assignedBy = anyUsers[1];
    } else {
      var assignee = technologyUsers[0];
      var assignedBy = adminUsers[0];
    }
    
    console.log('Assignee:', assignee.full_name, assignee.email);
    console.log('Assigned by:', assignedBy.full_name, assignedBy.email);
    
    // Create a unique task title
    const uniqueTitle = `Test Task ${Date.now()} ${Math.random().toString(36).substr(2, 9)}`;
    
    const testTask = {
      title: uniqueTitle,
      description: 'This is a test task to verify the fix',
      assigned_to: assignee.id,
      assigned_by: assignedBy.id,
      priority: 'medium',
      status: 'pending',
      department: assignee.department,
      category: 'Testing'
    };
    
    console.log('Test task data:', testTask);
    
    try {
      const createdTask = await taskApi.create(testTask);
      console.log('✅ Task creation successful!');
      console.log('Created task:', createdTask);
      
      // Test 4: Verify the task was created
      console.log('\n🔍 Test 4: Verifying task creation...');
      const allTasks = await taskApi.getAll();
      const foundTask = allTasks.find(t => t.id === createdTask.id);
      
      if (foundTask) {
        console.log('✅ Task found in database:', foundTask.title);
      } else {
        console.log('⚠️ Task not found in database');
      }
      
      // Clean up - delete the test task
      console.log('\n🧹 Cleaning up test task...');
      try {
        await taskApi.delete(createdTask.id);
        console.log('✅ Test task cleaned up successfully');
      } catch (cleanupError) {
        console.log('⚠️ Could not clean up test task:', cleanupError.message);
      }
      
    } catch (error) {
      console.error('❌ Task creation failed:', error);
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: error.status,
        statusText: error.statusText
      });
      
      // Check for specific error types
      if (error.message && error.message.includes('duplicate')) {
        console.log('🚨 Duplicate key error - try a different task title');
      }
      if (error.message && error.message.includes('constraint')) {
        console.log('🚨 Constraint violation - check foreign key references');
      }
      if (error.message && error.message.includes('permission')) {
        console.log('🚨 Permission error - check RLS policies');
      }
      if (error.message && error.message.includes('relation')) {
        console.log('🚨 Table not found error - check if tasks table exists');
      }
    }
    
    console.log('\n🎉 Task creation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testTaskCreationFix();

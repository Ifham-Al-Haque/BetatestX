// Debug Task Creation Error
// Run this in your browser console to see the exact error

const debugTaskCreationError = async () => {
  try {
    console.log('🔍 Debugging Task Creation Error...');
    
    // Import services
    const { apiService } = await import('./src/services/api.js');
    const { taskApi } = await import('./src/services/taskApi.js');
    
    // Test 1: Check if we can get users
    console.log('\n👥 Test 1: Getting users...');
    const users = await apiService.userManagement.getAll();
    console.log('✅ Users found:', users.length);
    
    if (users.length === 0) {
      console.error('❌ No users found - cannot test task creation');
      return;
    }
    
    // Test 2: Check if we can get tasks
    console.log('\n📋 Test 2: Getting existing tasks...');
    try {
      const existingTasks = await taskApi.getAll();
      console.log('✅ Existing tasks:', existingTasks.length);
    } catch (error) {
      console.error('❌ Cannot get existing tasks:', error);
    }
    
    // Test 3: Try to create a simple task
    console.log('\n📝 Test 3: Creating a test task...');
    
    const technologyUsers = users.filter(u => u.department === 'TECHNOLOGY' && u.status === 'active');
    const adminUsers = users.filter(u => u.role === 'admin' && u.status === 'active');
    
    if (technologyUsers.length === 0 || adminUsers.length === 0) {
      console.log('⚠️ Not enough users to test task creation');
      console.log('Technology users:', technologyUsers.length);
      console.log('Admin users:', adminUsers.length);
      return;
    }
    
    const assignee = technologyUsers[0];
    const assignedBy = adminUsers[0];
    
    console.log('Assignee:', assignee.full_name, assignee.email);
    console.log('Assigned by:', assignedBy.full_name, assignedBy.email);
    
    // Create a minimal task object
    const testTask = {
      title: `Test Task ${Date.now()}`,
      description: 'This is a test task',
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
      console.log('✅ Task creation successful:', createdTask);
      
      // Clean up
      try {
        await taskApi.delete(createdTask.id);
        console.log('✅ Test task cleaned up');
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
        console.log('🚨 Duplicate key error - task with same title might exist');
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
    
    // Test 4: Check tasks table structure
    console.log('\n🗄️ Test 4: Checking tasks table...');
    try {
      const { supabase } = await import('./src/supabaseClient.js');
      const { data: tableInfo, error: tableError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Tasks table error:', tableError);
      } else {
        console.log('✅ Tasks table accessible');
      }
    } catch (error) {
      console.error('❌ Cannot check tasks table:', error);
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('1. Check if users are accessible (Test 1)');
    console.log('2. Check if tasks table is accessible (Test 2)');
    console.log('3. Check task creation error details (Test 3)');
    console.log('4. Check tasks table structure (Test 4)');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugTaskCreationError();

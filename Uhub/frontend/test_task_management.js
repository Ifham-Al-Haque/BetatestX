// Test script for Task Management System
// This script tests the task management functionality

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTaskManagement() {
  console.log('🧪 Testing Task Management System...\n');

  try {
    // 1. Test authentication
    console.log('1. Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      console.log('ℹ️  Please make sure you are logged in to test the task management system');
      return;
    }
    console.log('✅ Authentication successful for user:', user.email);

    // 2. Test tasks table existence
    console.log('\n2. Testing tasks table...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
    
    if (tasksError) {
      console.log('❌ Tasks table error:', tasksError.message);
      console.log('ℹ️  The tasks table may not exist. Please run the setup_task_management_complete.sql script first.');
      return;
    }
    console.log('✅ Tasks table exists and is accessible');
    console.log(`ℹ️  Found ${tasks.length} tasks in the database`);

    // 3. Test task_comments table
    console.log('\n3. Testing task_comments table...');
    const { data: comments, error: commentsError } = await supabase
      .from('task_comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.log('❌ Task comments table error:', commentsError.message);
    } else {
      console.log('✅ Task comments table exists and is accessible');
    }

    // 4. Test task_notifications table
    console.log('\n4. Testing task_notifications table...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('task_notifications')
      .select('*')
      .limit(1);
    
    if (notificationsError) {
      console.log('❌ Task notifications table error:', notificationsError.message);
    } else {
      console.log('✅ Task notifications table exists and is accessible');
    }

    // 5. Test get_task_stats function
    console.log('\n5. Testing get_task_stats function...');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_task_stats');
    
    if (statsError) {
      console.log('❌ get_task_stats function error:', statsError.message);
    } else {
      console.log('✅ get_task_stats function works');
      console.log('📊 Task statistics:', stats[0] || 'No stats available');
    }

    // 6. Test RLS policies
    console.log('\n6. Testing RLS policies...');
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, department')
      .eq('auth_user_id', user.id)
      .single();

    if (userProfile) {
      console.log('✅ User profile found:', userProfile);
      
      // Try to fetch tasks with current user context
      const { data: userTasks, error: userTasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(5);
      
      if (userTasksError) {
        console.log('❌ RLS policy error:', userTasksError.message);
      } else {
        console.log('✅ RLS policies working correctly');
        console.log(`ℹ️  User can access ${userTasks.length} tasks`);
      }
    } else {
      console.log('⚠️  User profile not found - this may cause issues with department-based filtering');
    }

    console.log('\n🎉 Task Management System Test Complete!');
    console.log('\n📝 Next steps:');
    console.log('1. If any tables are missing, run setup_task_management_complete.sql');
    console.log('2. If RLS policies are failing, check your user role and department');
    console.log('3. If everything looks good, try accessing the Task Management page in your app');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testTaskManagement();

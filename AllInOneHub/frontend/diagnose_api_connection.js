// Diagnose API Connection for Real Users
// Run this in your browser console to test the API connection

const diagnoseApiConnection = async () => {
  try {
    console.log('🔍 Diagnosing API Connection for Real Users...');
    
    // Test 1: Check if API service is available
    console.log('\n📡 Test 1: Checking API service availability...');
    const { apiService } = await import('./src/services/api.js');
    console.log('✅ API service loaded:', !!apiService);
    console.log('✅ UserManagement service:', !!apiService.userManagement);
    console.log('✅ UserManagement.getAll method:', !!apiService.userManagement.getAll);
    
    // Test 2: Try to fetch users with detailed error handling
    console.log('\n👥 Test 2: Fetching users from database...');
    const { data: users, error } = await apiService.userManagement.getAll();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status: error.status,
        statusText: error.statusText
      });
      
      // Check if it's an RLS policy issue
      if (error.message && error.message.includes('policy')) {
        console.log('🚨 This looks like an RLS (Row Level Security) policy issue!');
        console.log('💡 Solution: Check RLS policies on the users table');
      }
      
      // Check if it's an authentication issue
      if (error.message && (error.message.includes('auth') || error.message.includes('permission'))) {
        console.log('🚨 This looks like an authentication/permission issue!');
        console.log('💡 Solution: Check if the current user has access to the users table');
      }
      
      return;
    }
    
    console.log('✅ Successfully connected to database');
    console.log('📊 Raw users data:', users);
    console.log('📊 Number of users found:', users ? users.length : 0);
    
    // Test 3: Analyze the user data
    if (users && users.length > 0) {
      console.log('\n📊 Test 3: Analyzing user data...');
      
      const analysis = {
        total: users.length,
        withNames: users.filter(u => u.full_name && u.full_name !== 'N/A').length,
        withEmails: users.filter(u => u.email && u.email !== 'N/A').length,
        withDepartments: users.filter(u => u.department && u.department !== 'N/A' && u.department !== '').length,
        active: users.filter(u => u.status === 'active').length,
        withRoles: users.filter(u => u.role && u.role !== 'N/A').length
      };
      
      console.log('User data analysis:', analysis);
      
      // Test 4: Show sample users
      console.log('\n👤 Test 4: Sample users:');
      users.slice(0, 10).forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || 'No Name'} (${user.email || 'No Email'})`);
        console.log(`   Role: ${user.role || 'No Role'}`);
        console.log(`   Department: ${user.department || 'No Department'}`);
        console.log(`   Status: ${user.status || 'No Status'}`);
        console.log('---');
      });
      
      // Test 5: Check departments
      console.log('\n🏢 Test 5: Department analysis:');
      const departments = [...new Set(users.map(u => u.department).filter(d => d && d !== 'N/A' && d !== ''))];
      console.log('Available departments:', departments);
      
      departments.forEach(dept => {
        const deptUsers = users.filter(u => u.department === dept);
        console.log(`${dept}: ${deptUsers.length} users`);
        deptUsers.forEach(u => console.log(`  - ${u.full_name} (${u.email})`));
      });
      
      // Test 6: Test department filtering (simulate frontend logic)
      console.log('\n🔍 Test 6: Testing department filtering...');
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
      
    } else {
      console.log('⚠️ No users found in database');
      console.log('This could mean:');
      console.log('1. Users table is empty');
      console.log('2. RLS policies are blocking access');
      console.log('3. Database connection issue');
      console.log('4. API service configuration problem');
    }
    
    console.log('\n🎉 API connection diagnosis completed!');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    console.log('This might be due to:');
    console.log('1. API service not properly imported');
    console.log('2. Database connection issues');
    console.log('3. Authentication problems');
    console.log('4. Network connectivity issues');
    console.log('5. RLS policies blocking access');
  }
};

// Run the diagnosis
diagnoseApiConnection();

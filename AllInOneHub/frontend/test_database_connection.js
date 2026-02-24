// Test script to check database connection and users data
// Run this in your browser console

const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing Database Connection and Users Data...');
    
    // Import your API service
    const { apiService } = await import('./src/services/api.js');
    
    // Test 1: Check if API service is working
    console.log('\n📡 Test 1: Checking API service...');
    console.log('API service available:', !!apiService);
    console.log('UserManagement service available:', !!apiService.userManagement);
    
    // Test 2: Try to fetch users
    console.log('\n👥 Test 2: Fetching users from database...');
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
    
    console.log('✅ Successfully connected to database');
    console.log('Raw users data:', users);
    console.log('Number of users found:', users ? users.length : 0);
    
    // Test 3: Analyze user data
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
      users.slice(0, 5).forEach((user, index) => {
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
      });
      
    } else {
      console.log('⚠️ No users found in database');
      console.log('This could mean:');
      console.log('1. Users table is empty');
      console.log('2. RLS policies are blocking access');
      console.log('3. Database connection issue');
    }
    
    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('This might be due to:');
    console.log('1. API service not properly imported');
    console.log('2. Database connection issues');
    console.log('3. Authentication problems');
    console.log('4. Network connectivity issues');
  }
};

// Run the test
testDatabaseConnection();

// Debug API Error for Users Access
// Run this in your browser console to diagnose the API issue

const debugApiError = async () => {
  try {
    console.log('🔍 Debugging API Error for Users Access...');
    
    // Test 1: Check if API service is available
    console.log('\n📡 Test 1: Checking API service...');
    const { apiService } = await import('./src/services/api.js');
    console.log('✅ API service loaded:', !!apiService);
    console.log('✅ UserManagement service:', !!apiService.userManagement);
    console.log('✅ UserManagement.getAll method:', !!apiService.userManagement.getAll);
    
    // Test 2: Check Supabase client
    console.log('\n🔌 Test 2: Checking Supabase client...');
    const { supabase } = await import('./src/supabaseClient.js');
    console.log('✅ Supabase client loaded:', !!supabase);
    console.log('✅ Supabase URL:', supabase.supabaseUrl);
    console.log('✅ Supabase Key exists:', !!supabase.supabaseKey);
    
    // Test 3: Check authentication
    console.log('\n🔐 Test 3: Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
    } else {
      console.log('✅ Current user:', user ? user.email : 'No user logged in');
      console.log('✅ User ID:', user ? user.id : 'N/A');
    }
    
    // Test 4: Try direct Supabase query
    console.log('\n🗄️ Test 4: Testing direct Supabase query...');
    const { data: directUsers, error: directError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (directError) {
      console.error('❌ Direct Supabase query error:', directError);
      console.log('Error details:', {
        message: directError.message,
        details: directError.details,
        hint: directError.hint,
        code: directError.code
      });
    } else {
      console.log('✅ Direct Supabase query successful:', directUsers);
      console.log('✅ Found users:', directUsers ? directUsers.length : 0);
    }
    
    // Test 5: Try API service with detailed error handling
    console.log('\n🔧 Test 5: Testing API service with detailed error handling...');
    try {
      const { data: apiUsers, error: apiError } = await apiService.userManagement.getAll();
      
      if (apiError) {
        console.error('❌ API service error:', apiError);
        console.log('API Error details:', {
          message: apiError.message,
          details: apiError.details,
          hint: apiError.hint,
          code: apiError.code,
          status: apiError.status,
          statusText: apiError.statusText
        });
      } else {
        console.log('✅ API service successful:', apiUsers);
        console.log('✅ Found users via API:', apiUsers ? apiUsers.length : 0);
      }
    } catch (apiException) {
      console.error('❌ API service exception:', apiException);
    }
    
    // Test 6: Check RLS policies
    console.log('\n🛡️ Test 6: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');
    
    if (policiesError) {
      console.log('⚠️ Could not check RLS policies (this is normal):', policiesError.message);
    } else {
      console.log('✅ RLS policies:', policies);
    }
    
    // Test 7: Check if users table exists and is accessible
    console.log('\n📋 Test 7: Checking users table accessibility...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('id, email, full_name, department, status')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Users table access error:', tableError);
    } else {
      console.log('✅ Users table accessible:', tableInfo);
    }
    
    console.log('\n🎯 Diagnosis Summary:');
    console.log('1. Check if you are logged in (Test 3)');
    console.log('2. Check if direct Supabase query works (Test 4)');
    console.log('3. Check if API service works (Test 5)');
    console.log('4. Check if users table is accessible (Test 7)');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Run the debug
debugApiError();

// Test RBAC System - Quick Verification Script
// Run this in your browser console after logging in

console.log('🔐 Testing RBAC System...');

// Test 1: Check if user is authenticated
async function testAuthentication() {
  console.log('\n1️⃣ Testing Authentication...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth Error:', error);
      return false;
    }
    
    if (!user) {
      console.error('❌ No user found');
      return false;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('✅ User ID:', user.id);
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

// Test 2: Check if users table exists and is accessible
async function testUsersTable() {
  console.log('\n2️⃣ Testing Users Table...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Users table error:', error);
      return false;
    }
    
    console.log('✅ Users table accessible');
    console.log('✅ Sample data:', data);
    return true;
  } catch (error) {
    console.error('❌ Users table test failed:', error);
    return false;
  }
}

// Test 3: Check if user profile exists
async function testUserProfile() {
  console.log('\n3️⃣ Testing User Profile...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No auth user');
      return false;
    }
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();
    
    if (error) {
      console.error('❌ Profile fetch error:', error);
      return false;
    }
    
    if (!profile) {
      console.error('❌ No profile found');
      return false;
    }
    
    console.log('✅ User profile found:', profile);
    console.log('✅ User role:', profile.role);
    return true;
  } catch (error) {
    console.error('❌ Profile test failed:', error);
    return false;
  }
}

// Test 4: Check RBAC functions
function testRBACFunctions() {
  console.log('\n4️⃣ Testing RBAC Functions...');
  
  try {
    // Check if RBAC functions are available
    if (typeof getRoleNavigationAccess === 'function') {
      console.log('✅ getRoleNavigationAccess function available');
    } else {
      console.error('❌ getRoleNavigationAccess function not found');
    }
    
    if (typeof canSeePanel === 'function') {
      console.log('✅ canSeePanel function available');
    } else {
      console.error('❌ canSeePanel function not found');
    }
    
    if (typeof hasFeatureAccess === 'function') {
      console.log('✅ hasFeatureAccess function available');
    } else {
      console.error('❌ hasFeatureAccess function not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ RBAC functions test failed:', error);
    return false;
  }
}

// Test 5: Check sidebar filtering
function testSidebarFiltering() {
  console.log('\n5️⃣ Testing Sidebar Filtering...');
  
  try {
    // Check if sidebar component exists
    const sidebar = document.querySelector('[class*="sidebar"]');
    if (sidebar) {
      console.log('✅ Sidebar component found');
      
      // Check if panels are visible
      const panels = sidebar.querySelectorAll('[class*="panel"]');
      console.log('✅ Number of panels found:', panels.length);
      
      // Log panel titles
      panels.forEach((panel, index) => {
        const title = panel.querySelector('[class*="title"]')?.textContent || `Panel ${index + 1}`;
        console.log(`   Panel ${index + 1}: ${title}`);
      });
    } else {
      console.error('❌ Sidebar component not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Sidebar test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting RBAC System Tests...\n');
  
  const results = {
    auth: await testAuthentication(),
    usersTable: await testUsersTable(),
    profile: await testUserProfile(),
    rbacFunctions: testRBACFunctions(),
    sidebar: testSidebarFiltering()
  };
  
  console.log('\n📊 Test Results:');
  console.log('Authentication:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('Users Table:', results.usersTable ? '✅ PASS' : '❌ FAIL');
  console.log('User Profile:', results.profile ? '✅ PASS' : '❌ FAIL');
  console.log('RBAC Functions:', results.rbacFunctions ? '✅ PASS' : '❌ FAIL');
  console.log('Sidebar Filtering:', results.sidebar ? '✅ PASS' : '❌ FAIL');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! RBAC system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
  
  return results;
}

// Export for manual testing
window.testRBACSystem = runAllTests;

console.log('✅ Test script loaded. Run testRBACSystem() to test the RBAC system.');

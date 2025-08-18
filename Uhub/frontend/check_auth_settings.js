// Check Supabase Auth Settings
// Run this in your browser console

console.log('🔧 Checking Supabase Auth Configuration...');

// Test 1: Check current session
async function checkCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔑 Current session:', session);
    console.log('❌ Session error:', error);
  } catch (err) {
    console.error('💥 Session check error:', err);
  }
}

// Test 2: Check if we can get user info
async function checkUserInfo() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('👤 Current user:', user);
    console.log('❌ User error:', error);
  } catch (err) {
    console.error('💥 User check error:', err);
  }
}

// Test 3: Check auth state
async function checkAuthState() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ User is authenticated');
      console.log('📧 Email confirmed:', user.email_confirmed_at);
      console.log('📧 Email:', user.email);
      console.log('🆔 User ID:', user.id);
    } else {
      console.log('❌ No authenticated user');
    }
  } catch (err) {
    console.error('💥 Auth state check error:', err);
  }
}

// Test 4: Check if we can access protected data
async function checkProtectedAccess() {
  try {
    console.log('📊 Testing protected table access...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('📊 Protected access result:', { data, error });
    
    if (error) {
      console.error('❌ Cannot access protected data:', error);
    } else {
      console.log('✅ Can access protected data');
    }
  } catch (error) {
    console.error('💥 Protected access error:', error);
  }
}

// Run all checks
console.log('🚀 Starting auth configuration checks...');
checkCurrentSession().then(() => {
  checkUserInfo().then(() => {
    checkAuthState().then(() => {
      checkProtectedAccess();
    });
  });
});

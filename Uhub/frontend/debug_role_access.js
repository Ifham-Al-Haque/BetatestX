// Debug script to check role access in browser console
// Copy and paste this into browser console while logged in as ifham@udrive.ae

console.log('🔍 Debugging Role Access for ifham@udrive.ae');

// Check if AuthContext is available
if (window.React && window.React.useContext) {
  console.log('✅ React is available');
} else {
  console.log('❌ React not available');
}

// Check localStorage for any auth data
console.log('🔍 Local Storage auth data:', {
  supabase_auth_token: localStorage.getItem('supabase.auth.token'),
  supabase_session: localStorage.getItem('supabase.session')
});

// Check if there are any auth-related objects in window
console.log('🔍 Window auth objects:', {
  supabase: !!window.supabase,
  authContext: !!window.AuthContext
});

// Function to check current user role (paste this in console)
function checkCurrentUserRole() {
  console.log('🔍 Checking current user role...');
  
  // Try to get user from various sources
  const authToken = localStorage.getItem('supabase.auth.token');
  if (authToken) {
    try {
      const tokenData = JSON.parse(authToken);
      console.log('📋 Auth token data:', tokenData);
    } catch (e) {
      console.log('❌ Error parsing auth token:', e);
    }
  }
  
  // Check for any React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools available');
  }
  
  console.log('🔍 Current URL:', window.location.href);
  console.log('🔍 Current pathname:', window.location.pathname);
}

// Run the check
checkCurrentUserRole();

console.log('🎯 Instructions:');
console.log('1. Check the auth token data above');
console.log('2. Look for any error messages in the console');
console.log('3. Try refreshing the page and check again');
console.log('4. Check Network tab for any failed API calls');

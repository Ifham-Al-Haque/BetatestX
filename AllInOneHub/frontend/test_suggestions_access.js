// Test Suggestions Feature Access
// Run this in the browser console to debug the suggestions routing issue

console.log('=== Testing Suggestions Feature Access ===');

// Check if the user is authenticated
const authContext = document.querySelector('[data-testid="auth-context"]') || {};
console.log('Auth Context:', authContext);

// Check the current user role
const userRole = localStorage.getItem('userRole') || 'unknown';
console.log('User Role:', userRole);

// Check if suggestions feature is defined
console.log('=== Feature Access Check ===');

// Simulate the feature access check
const FEATURE_ACCESS = {
  suggestions: ['admin', 'manager', 'hr_manager', 'cs_manager', 'employee']
};

function hasFeatureAccess(userRole, feature) {
  if (!userRole || !feature) {
    console.log('hasFeatureAccess: Missing userRole or feature', { userRole, feature });
    return false;
  }
  
  const allowedRoles = FEATURE_ACCESS[feature];
  if (!allowedRoles) {
    console.log('hasFeatureAccess: Feature not found in FEATURE_ACCESS', { feature, userRole });
    return false;
  }
  
  const hasAccess = allowedRoles.includes(userRole);
  console.log(`Feature "${feature}" access for role "${userRole}":`, hasAccess);
  return hasAccess;
}

// Test the suggestions feature access
const suggestionsAccess = hasFeatureAccess(userRole, 'suggestions');
console.log('Suggestions Access:', suggestionsAccess);

// Check current route
console.log('Current URL:', window.location.href);
console.log('Current Pathname:', window.location.pathname);

// Check if there are any React Router errors
console.log('=== React Router Check ===');
const routerContext = document.querySelector('[data-testid="router-context"]') || {};
console.log('Router Context:', routerContext);

// Check for any console errors
console.log('=== Console Errors Check ===');
const consoleErrors = [];
const originalError = console.error;
console.error = function(...args) {
  consoleErrors.push(args);
  originalError.apply(console, args);
};

// Wait a moment and then check for errors
setTimeout(() => {
  console.log('Console Errors during test:', consoleErrors);
  console.log('=== Test Complete ===');
}, 1000);

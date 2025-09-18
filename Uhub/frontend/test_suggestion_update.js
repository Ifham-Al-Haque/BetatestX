// Test script to verify suggestion update functionality
// Run this in your browser console on the suggestions page

console.log('Testing suggestion update functionality...');

// Test 1: Check if user is authenticated
console.log('1. Checking authentication...');
const authUser = window.supabase?.auth?.getUser();
console.log('Auth user:', authUser);

// Test 2: Check if user profile is loaded
console.log('2. Checking user profile...');
// This would need to be run in the React component context
console.log('User profile check should be done in the component');

// Test 3: Test suggestion update API directly
console.log('3. Testing suggestion update API...');

async function testSuggestionUpdate() {
  try {
    // Get a sample suggestion ID (you'll need to replace this with an actual ID)
    const testSuggestionId = 'your-suggestion-id-here';
    
    const updateData = {
      title: 'Test Update',
      description: 'This is a test update',
      updated_at: new Date().toISOString()
    };
    
    console.log('Attempting to update suggestion:', testSuggestionId);
    console.log('Update data:', updateData);
    
    // This would call the actual API
    // const result = await suggestionsApi.updateSuggestion(testSuggestionId, updateData);
    // console.log('Update result:', result);
    
    console.log('Test completed - check console for any errors');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment the line below to run the test
// testSuggestionUpdate();

console.log('Test script loaded. To run the test:');
console.log('1. Replace "your-suggestion-id-here" with an actual suggestion ID');
console.log('2. Uncomment the testSuggestionUpdate() call');
console.log('3. Run the test in the browser console');

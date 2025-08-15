// Test script for the invite_user system
// Run this in your browser console or create a test page

// Test the invite_user function directly
async function testInviteUserFunction() {
  console.log('🧪 Testing invite_user function...');
  
  try {
    const { data, error } = await supabase
      .rpc('invite_user', {
        invite_email: 'test@example.com',
        invite_role: 'employee',
        inviter_id: 'your-user-id-here' // Replace with actual user ID
      });
    
    if (error) {
      console.error('❌ Function call failed:', error);
      return false;
    }
    
    console.log('✅ Function call successful:', data);
    
    if (data.success) {
      console.log('✅ Invitation created successfully');
      console.log('📧 Email:', data.data.email);
      console.log('🔑 Token:', data.data.token);
      console.log('🔗 Invitation URL:', `${window.location.origin}/invite/${data.data.token}`);
    } else {
      console.log('⚠️ Function returned success: false:', data.error);
    }
    
    return data.success;
  } catch (err) {
    console.error('❌ Test failed:', err);
    return false;
  }
}

// Test the get_pending_invitations function
async function testGetPendingInvitations() {
  console.log('🧪 Testing get_pending_invitations function...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_pending_invitations');
    
    if (error) {
      console.error('❌ Function call failed:', error);
      return false;
    }
    
    console.log('✅ Function call successful:', data);
    console.log('📋 Number of pending invitations:', data ? data.length : 0);
    
    if (data && data.length > 0) {
      console.log('📧 First invitation:', data[0]);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Test failed:', err);
    return false;
  }
}

// Test the complete flow
async function testCompleteFlow() {
  console.log('🚀 Testing complete invitation flow...');
  
  // Step 1: Test get_pending_invitations
  const invitationsWorking = await testGetPendingInvitations();
  if (!invitationsWorking) {
    console.log('❌ Cannot proceed - get_pending_invitations not working');
    return;
  }
  
  // Step 2: Test invite_user
  const inviteWorking = await testInviteUserFunction();
  if (!inviteWorking) {
    console.log('❌ Cannot proceed - invite_user not working');
    return;
  }
  
  // Step 3: Verify invitation was created
  console.log('🔄 Refreshing invitations list...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  const { data: updatedInvitations } = await supabase
    .rpc('get_pending_invitations');
  
  const testInvitation = updatedInvitations?.find(inv => inv.email === 'test@example.com');
  
  if (testInvitation) {
    console.log('✅ Complete flow test successful!');
    console.log('📧 New invitation found:', testInvitation);
    console.log('🔗 Test invitation URL:', `${window.location.origin}/invite/${testInvitation.token}`);
  } else {
    console.log('❌ Invitation not found in updated list');
  }
}

// Run tests
console.log('🧪 Starting invitation system tests...');
console.log('📝 Instructions:');
console.log('1. Make sure you are logged in to Supabase');
console.log('2. Replace "your-user-id-here" with your actual user ID');
console.log('3. Run testCompleteFlow() to test everything');

// Export functions for manual testing
window.testInviteUserFunction = testInviteUserFunction;
window.testGetPendingInvitations = testGetPendingInvitations;
window.testCompleteFlow = testCompleteFlow;

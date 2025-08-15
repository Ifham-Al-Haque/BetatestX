// TEST SCRIPT - Test Supabase functions directly from terminal
// Run this with: node test_invitation_functions.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('Make sure you have REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctions() {
  console.log('🧪 Testing Supabase Functions...\n');

  try {
    // Test 1: get_pending_invitations
    console.log('1️⃣ Testing get_pending_invitations...');
    const { data: invitations, error: invitationsError } = await supabase
      .rpc('get_pending_invitations');
    
    if (invitationsError) {
      console.error('❌ get_pending_invitations failed:', invitationsError);
    } else {
      console.log('✅ get_pending_invitations success:', invitations?.length || 0, 'invitations found');
    }

    // Test 2: invite_user
    console.log('\n2️⃣ Testing invite_user...');
    const { data: inviteData, error: inviteError } = await supabase
      .rpc('invite_user', {
        invite_email: 'test@example.com',
        invite_role: 'employee',
        inviter_id: '00000000-0000-0000-0000-000000000000'
      });
    
    if (inviteError) {
      console.error('❌ invite_user failed:', inviteError);
    } else {
      console.log('✅ invite_user success:', inviteData);
    }

    // Test 3: get_invitation_by_token
    console.log('\n3️⃣ Testing get_invitation_by_token...');
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_invitation_by_token', {
        invitation_token: 'test-token'
      });
    
    if (tokenError) {
      console.error('❌ get_invitation_by_token failed:', tokenError);
    } else {
      console.log('✅ get_invitation_by_token success:', tokenData);
    }

    // Test 4: accept_invitation
    console.log('\n4️⃣ Testing accept_invitation...');
    const { data: acceptData, error: acceptError } = await supabase
      .rpc('accept_invitation', [
        'test-token',
        'testpassword',
        'Test User',
        '1234567890',
        'Test Location'
      ]);
    
    if (acceptError) {
      console.error('❌ accept_invitation failed:', acceptError);
    } else {
      console.log('✅ accept_invitation success:', acceptData);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the tests
testFunctions();

// Test script to verify invitation system fix after resolving type mismatches
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvitationSystem() {
    console.log('🧪 Testing Invitation System Fix (After Type Mismatch Resolution)...\n');

    try {
        // Test 1: Check if get_pending_invitations function exists and works
        console.log('1️⃣ Testing get_pending_invitations function...');
        const { data: pendingInvitations, error: pendingError } = await supabase
            .rpc('get_pending_invitations');

        if (pendingError) {
            console.error('❌ get_pending_invitations failed:', pendingError);
        } else {
            console.log('✅ get_pending_invitations working:', pendingInvitations);
        }

        // Test 2: Test send_invitation function with VARCHAR parameters
        console.log('\n2️⃣ Testing send_invitation function...');
        const testEmail = `test-${Date.now()}@example.com`;
        const { data: sendResult, error: sendError } = await supabase
            .rpc('send_invitation', {
                invite_email: testEmail,
                invite_role: 'employee',
                inviter_id: null // We'll test without inviter_id for now
            });

        if (sendError) {
            console.error('❌ send_invitation failed:', sendError);
            console.error('Error details:', sendError);
        } else {
            console.log('✅ send_invitation working:', sendResult);
        }

        // Test 3: Test if we can fetch the invitation we just created
        if (sendResult && sendResult.success) {
            console.log('\n3️⃣ Testing fetch after creation...');
            const { data: newPendingInvitations, error: fetchError } = await supabase
                .rpc('get_pending_invitations');

            if (fetchError) {
                console.error('❌ Fetch after creation failed:', fetchError);
            } else {
                console.log('✅ Fetch after creation working:', newPendingInvitations);
            }

            // Test 4: Test cancel_invitation function
            if (sendResult && sendResult.success) {
                console.log('\n4️⃣ Testing cancel_invitation function...');
                const { data: cancelResult, error: cancelError } = await supabase
                    .rpc('cancel_invitation', {
                        invitation_id: sendResult.invitation_id,
                        canceller_id: null
                    });

                if (cancelError) {
                    console.error('❌ cancel_invitation failed:', cancelError);
                } else {
                    console.log('✅ cancel_invitation working:', cancelResult);
                }
            }

            // Test 5: Test resend_invitation function (will fail since we cancelled it)
            if (sendResult && sendResult.success) {
                console.log('\n5️⃣ Testing resend_invitation function...');
                const { data: resendResult, error: resendError } = await supabase
                    .rpc('resend_invitation', {
                        invitation_id: sendResult.invitation_id,
                        resender_id: null
                    });

                if (resendError) {
                    console.log('ℹ️ resend_invitation expected to fail (invitation was cancelled):', resendError.message);
                } else {
                    console.log('✅ resend_invitation working:', resendResult);
                }
            }
        }

        console.log('\n🎉 Invitation System Test Complete!');

    } catch (error) {
        console.error('💥 Test failed with error:', error);
    }
}

// Run the test
testInvitationSystem();

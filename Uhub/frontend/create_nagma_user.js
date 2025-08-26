// Create nagma@udrive.ae user in Supabase Auth
// Run this script in your browser console on a page that has Supabase loaded

console.log('🔧 Creating nagma@udrive.ae user in Supabase Auth...');

async function createNagmaUser() {
  try {
    // Step 1: Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'nagma@udrive.ae',
      password: 'TempPassword123!', // Temporary password - user should change this
      options: {
        data: {
          role: 'hr_manager',
          full_name: 'Nagma',
          department: 'HR'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    if (authData.user) {
      console.log('✅ Auth user created successfully:', authData.user.id);
      console.log('📧 Email confirmed:', authData.user.email_confirmed_at);
      
      // Step 2: Update the employee record with the new auth_user_id
      const { data: updateData, error: updateError } = await supabase
        .from('employees')
        .update({
          auth_user_id: authData.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'nagma@udrive.ae')
        .select();

      if (updateError) {
        console.error('❌ Employee update failed:', updateError);
        return;
      }

      console.log('✅ Employee record updated:', updateData);

      // Step 3: Test the login
      console.log('🔑 Testing login with new credentials...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'nagma@udrive.ae',
        password: 'TempPassword123!'
      });

      if (loginError) {
        console.error('❌ Login test failed:', loginError);
      } else {
        console.log('✅ Login test successful:', loginData.user.id);
        
        // Sign out after test
        await supabase.auth.signOut();
        console.log('✅ Signed out after test');
      }

      console.log('🎉 User creation completed successfully!');
      console.log('📋 Next steps:');
      console.log('1. User can now log in with email: nagma@udrive.ae');
      console.log('2. User should change the temporary password on first login');
      console.log('3. The user is linked to the existing employee record');
      
    } else {
      console.warn('⚠️ No auth user data returned');
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the function
createNagmaUser();

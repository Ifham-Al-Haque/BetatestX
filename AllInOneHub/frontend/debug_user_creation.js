// Debug User Creation Script
// Run this in your browser console to test user creation

console.log('🧪 Testing User Creation...');

// Test 1: Check Supabase connection
console.log('🔧 Supabase URL:', supabase.supabaseUrl);
console.log('🔧 Supabase Key Length:', supabase.supabaseKey.length);

// Test 2: Try to create a test user
async function testUserCreation() {
  try {
    console.log('🔐 Step 1: Creating auth user...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-debug@example.com',
      password: 'password123',
      options: {
        data: {
          role: 'admin',
          full_name: 'Test Debug User'
        }
      }
    });

    console.log('🔐 Auth signup result:', { authData, authError });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    if (authData.user) {
      console.log('✅ Auth user created:', authData.user.id);
      
      // Test 3: Try to create database user
      console.log('💾 Step 2: Creating database user...');
      
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .insert({
          email: 'test-debug@example.com',
          role: 'admin',
          status: 'active',
          auth_user_id: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('💾 Database user creation result:', { dbData, dbError });

      if (dbError) {
        console.error('❌ Database user creation failed:', dbError);
      } else {
        console.log('✅ Database user created:', dbData);
      }
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testUserCreation();

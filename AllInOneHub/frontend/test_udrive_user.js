// Test UDrive User Creation
// Run this in your browser console

console.log('🧪 Testing UDrive User Creation...');

// Test 1: Check if supabase is available
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase client not found!');
  console.log('Make sure you are on a page that imports supabase');
} else {
  console.log('✅ Supabase client found');
  console.log('🔧 URL:', supabase.supabaseUrl);
}

// Test 2: Test with your actual email domain
async function testUDriveUserCreation() {
  try {
    console.log('🔐 Testing UDrive email domain...');
    
    const testEmail = 'test-' + Date.now() + '@udrive.ae';
    const testPassword = 'password123';
    
    console.log('📧 Test email:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'admin',
          full_name: 'Test UDrive User'
        }
      }
    });

    console.log('🔐 Auth signup result:', { authData, authError });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      console.error('❌ Error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        details: authError.details,
        hint: authError.hint
      });
      return;
    }

    if (authData.user) {
      console.log('✅ Auth user created successfully:', authData.user.id);
      console.log('📧 Email confirmed:', authData.user.email_confirmed_at);
      
      // Test 3: Try to create database user
      console.log('💾 Creating database user...');
      
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .insert({
          email: testEmail,
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
        
        // Test 4: Try to login
        console.log('🔑 Testing login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        console.log('🔑 Login result:', { loginData, loginError });
        
        if (loginError) {
          console.error('❌ Login failed:', loginError);
        } else {
          console.log('✅ Login successful:', loginData.user.id);
        }
      }
    } else {
      console.warn('⚠️ No auth user data returned');
      console.warn('⚠️ Full auth response:', authData);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test 3: Check if we can access the users table
async function testTableAccess() {
  try {
    console.log('📊 Testing table access...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('📊 Table access result:', { data, error });
    
    if (error) {
      console.error('❌ Cannot access users table:', error);
    } else {
      console.log('✅ Can access users table');
    }
  } catch (error) {
    console.error('💥 Table access error:', error);
  }
}

// Run tests
console.log('🚀 Starting UDrive tests...');
testTableAccess().then(() => {
  testUDriveUserCreation();
});

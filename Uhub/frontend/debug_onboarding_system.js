// Debug Onboarding System - Run in Browser Console
// This script helps diagnose why "Failed to load onboarding details" is occurring

console.log('🔍 Debugging Onboarding System...');

async function debugOnboardingSystem() {
  try {
    console.log('📊 Step 1: Checking database tables...');
    
    // Test 1: Check if employee_onboarding_records table exists
    try {
      const { data: records, error: recordsError } = await supabase
        .from('employee_onboarding_records')
        .select('*')
        .limit(1);
      
      if (recordsError) {
        if (recordsError.code === '42P01') {
          console.log('❌ employee_onboarding_records table does NOT exist');
          console.log('💡 Solution: Run bulletproof_onboarding_setup.sql in Supabase');
          return false;
        } else {
          console.log('⚠️ employee_onboarding_records table exists but has error:', recordsError.message);
        }
      } else {
        console.log('✅ employee_onboarding_records table exists');
        console.log('📊 Records count:', records?.length || 0);
      }
    } catch (tableError) {
      console.log('❌ Cannot access employee_onboarding_records table:', tableError.message);
      return false;
    }
    
    // Test 2: Check if employee_onboarding_templates table exists
    try {
      const { data: templates, error: templatesError } = await supabase
        .from('employee_onboarding_templates')
        .select('*')
        .limit(1);
      
      if (templatesError) {
        if (templatesError.code === '42P01') {
          console.log('❌ employee_onboarding_templates table does NOT exist');
          console.log('💡 Solution: Run bulletproof_onboarding_setup.sql in Supabase');
          return false;
        } else {
          console.log('⚠️ employee_onboarding_templates table exists but has error:', templatesError.message);
        }
      } else {
        console.log('✅ employee_onboarding_templates table exists');
        console.log('📊 Templates count:', templates?.length || 0);
      }
    } catch (templateError) {
      console.log('❌ Cannot access employee_onboarding_templates table:', templateError.message);
      return false;
    }
    
    console.log('\n🔧 Step 2: Testing API functions...');
    
    // Test 3: Test onboarding API
    if (typeof onboardingOffboardingApi === 'undefined') {
      console.log('❌ onboardingOffboardingApi not found');
      console.log('💡 Make sure you\'re on the Employee Onboarding page');
      return false;
    }
    
    // Test 4: Test templates API
    try {
      const templates = await onboardingOffboardingApi.templates.getAll();
      console.log('✅ Templates API working, returned:', templates?.length || 0, 'templates');
      if (templates?.length > 0) {
        console.log('📋 Sample template:', templates[0].name);
      }
    } catch (templatesApiError) {
      console.log('❌ Templates API failed:', templatesApiError.message);
    }
    
    // Test 5: Test onboarding records API
    try {
      const records = await onboardingOffboardingApi.onboardingRecords.getAll();
      console.log('✅ Onboarding records API working, returned:', records?.length || 0, 'records');
      if (records?.length > 0) {
        console.log('📋 Sample record:', records[0].full_name);
      }
    } catch (recordsApiError) {
      console.log('❌ Onboarding records API failed:', recordsApiError.message);
    }
    
    console.log('\n🎯 Step 3: Checking authentication...');
    
    // Test 6: Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ User not authenticated:', authError?.message || 'No user found');
      console.log('💡 Solution: Make sure you\'re logged in');
      return false;
    } else {
      console.log('✅ User authenticated:', user.email);
    }
    
    // Test 7: Check user record in users table
    try {
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (userError) {
        console.log('⚠️ User record not found in users table:', userError.message);
        console.log('💡 This might affect permissions but shouldn\'t prevent basic functionality');
      } else {
        console.log('✅ User record found:', userRecord.email, 'Role:', userRecord.role);
      }
    } catch (userRecordError) {
      console.log('⚠️ Cannot check user record:', userRecordError.message);
    }
    
    console.log('\n📋 Step 4: Summary and recommendations...');
    
    return true;
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
    return false;
  }
}

async function provideSolution() {
  console.log('\n🚀 SOLUTION STEPS:');
  console.log('1. Run this SQL script in Supabase SQL editor:');
  console.log('   📄 bulletproof_onboarding_setup.sql');
  console.log('');
  console.log('2. Refresh your browser completely');
  console.log('');
  console.log('3. Navigate back to Employee Onboarding section');
  console.log('');
  console.log('4. Check browser console for success messages');
  console.log('');
  console.log('5. Try creating a new onboarding record');
  
  console.log('\n🔧 Quick Manual Check:');
  console.log('Run this in Supabase SQL editor to verify:');
  console.log(`
    -- Check if tables exist
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%onboarding%';
  `);
}

// Run the debug
debugOnboardingSystem().then(success => {
  if (success) {
    console.log('\n🎉 System check completed successfully!');
    console.log('If you\'re still getting errors, the database tables may not be set up.');
  } else {
    console.log('\n❌ System check found issues.');
  }
  
  provideSolution();
});

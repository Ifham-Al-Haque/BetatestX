// Debug Onboarding ID Issue - Run in Browser Console
// This helps identify why the record lookup is failing

console.log('🔍 Debugging Onboarding ID Issue...');

async function debugOnboardingIdIssue() {
  try {
    console.log('📋 Step 1: Check what records exist in the database...');
    
    // Get all onboarding records to see their structure
    const { data: allRecords, error: allError } = await supabase
      .from('employee_onboarding_records')
      .select('id, record_id, full_name, email, onboarding_status')
      .limit(10);
    
    if (allError) {
      console.error('❌ Cannot access employee_onboarding_records table:', allError);
      console.log('💡 Solution: Run fix_all_onboarding_errors.sql in Supabase');
      return false;
    }
    
    console.log('✅ Found records in database:');
    allRecords.forEach(record => {
      console.log(`- ID: ${record.id}`);
      console.log(`- Record ID: ${record.record_id}`);
      console.log(`- Name: ${record.full_name}`);
      console.log(`- Status: ${record.onboarding_status}`);
      console.log('---');
    });
    
    if (allRecords.length === 0) {
      console.log('ℹ️ No onboarding records found in database');
      console.log('💡 Create a new onboarding record first');
      return false;
    }
    
    console.log('\n🔍 Step 2: Test record lookup with different ID fields...');
    
    const testRecord = allRecords[0];
    console.log('Testing with record:', testRecord.full_name);
    
    // Test lookup by main id
    try {
      const { data: byId, error: byIdError } = await supabase
        .from('employee_onboarding_records')
        .select('*')
        .eq('id', testRecord.id)
        .maybeSingle();
      
      if (byIdError) {
        console.log('❌ Lookup by id failed:', byIdError.message);
      } else if (byId) {
        console.log('✅ Lookup by id SUCCESS');
      } else {
        console.log('⚠️ Lookup by id returned no data');
      }
    } catch (idError) {
      console.log('❌ ID lookup error:', idError.message);
    }
    
    // Test lookup by record_id if it exists
    if (testRecord.record_id) {
      try {
        const { data: byRecordId, error: byRecordIdError } = await supabase
          .from('employee_onboarding_records')
          .select('*')
          .eq('record_id', testRecord.record_id)
          .maybeSingle();
        
        if (byRecordIdError) {
          console.log('❌ Lookup by record_id failed:', byRecordIdError.message);
        } else if (byRecordId) {
          console.log('✅ Lookup by record_id SUCCESS');
        } else {
          console.log('⚠️ Lookup by record_id returned no data');
        }
      } catch (recordIdError) {
        console.log('❌ Record ID lookup error:', recordIdError.message);
      }
    }
    
    console.log('\n🧪 Step 3: Test the API function...');
    
    // Test the actual API function
    try {
      const apiResult = await onboardingOffboardingApi.onboardingRecords.getById(testRecord.id);
      console.log('✅ API getById SUCCESS:', apiResult.full_name);
    } catch (apiError) {
      console.log('❌ API getById failed:', apiError.message);
      
      // Try with record_id
      if (testRecord.record_id) {
        try {
          const apiResult2 = await onboardingOffboardingApi.onboardingRecords.getById(testRecord.record_id);
          console.log('✅ API getById with record_id SUCCESS:', apiResult2.full_name);
        } catch (apiError2) {
          console.log('❌ API getById with record_id also failed:', apiError2.message);
        }
      }
    }
    
    console.log('\n📊 Step 4: Check table structure...');
    
    // Check table structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'employee_onboarding_records' 
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `
      });
    
    if (!columnsError && columns) {
      console.log('✅ Table structure:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
    return false;
  }
}

async function provideSolution() {
  console.log('\n🚀 SOLUTION STEPS:');
  console.log('');
  console.log('1. 🗄️ Database Setup:');
  console.log('   Run fix_all_onboarding_errors.sql in Supabase SQL editor');
  console.log('');
  console.log('2. 🔄 Browser Refresh:');
  console.log('   Clear cache and reload (Ctrl+Shift+R)');
  console.log('');
  console.log('3. 🧪 Test Again:');
  console.log('   - Create new onboarding record');
  console.log('   - Click to view details');
  console.log('   - Should work without 406 errors');
  console.log('');
  console.log('4. 🔍 If still failing:');
  console.log('   - Check console logs for specific error details');
  console.log('   - Verify record ID is being passed correctly');
  console.log('   - Ensure database tables have proper structure');
}

// Run the debug
console.log('Starting onboarding ID debug...\n');
debugOnboardingIdIssue().then(success => {
  if (success) {
    console.log('\n✅ Debug completed. Check the logs above for details.');
  } else {
    console.log('\n❌ Debug found critical issues that need to be fixed.');
  }
  
  provideSolution();
});

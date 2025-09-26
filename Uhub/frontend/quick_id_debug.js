// Quick ID Debug - Run in Browser Console
// This immediately shows the ID mismatch issue

console.log('🔍 Quick ID Debug...');

async function quickIdDebug() {
  try {
    // Get all records to see their actual IDs
    const { data: records, error } = await supabase
      .from('employee_onboarding_records')
      .select('id, record_id, full_name, email, onboarding_status');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('📊 Records in database:');
    records.forEach((record, index) => {
      console.log(`\n--- Record ${index + 1} ---`);
      console.log('Main ID:', record.id);
      console.log('Record ID:', record.record_id);
      console.log('Name:', record.full_name);
      console.log('Email:', record.email);
      console.log('Status:', record.onboarding_status);
    });
    
    // Test the problematic ID
    const problemId = '32442ad8-6954-4823-8424-b1c6be24cd0c';
    console.log(`\n🔍 Testing problematic ID: ${problemId}`);
    
    const matchingRecord = records.find(r => 
      r.id === problemId || 
      r.record_id === problemId
    );
    
    if (matchingRecord) {
      console.log('✅ Found matching record:', matchingRecord.full_name);
    } else {
      console.log('❌ No record matches the problematic ID');
      console.log('💡 The ID being passed is incorrect or from old data');
    }
    
    // Show what the correct IDs should be
    if (records.length > 0) {
      console.log('\n✅ Correct IDs to use:');
      records.forEach(r => {
        console.log(`For ${r.full_name}:`);
        console.log(`  - Main ID: ${r.id}`);
        console.log(`  - Record ID: ${r.record_id || 'null'}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Quick debug failed:', error);
  }
}

// Test the API function directly
async function testApiFunction() {
  try {
    console.log('\n🧪 Testing API function...');
    
    // Get the first record's actual ID
    const { data: firstRecord } = await supabase
      .from('employee_onboarding_records')
      .select('id, record_id, full_name')
      .limit(1)
      .single();
    
    if (firstRecord) {
      console.log('Testing with correct ID:', firstRecord.id);
      
      // Test the API
      const result = await onboardingOffboardingApi.onboardingRecords.getById(firstRecord.id);
      console.log('✅ API test SUCCESS:', result.full_name);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run both tests
quickIdDebug().then(() => {
  testApiFunction();
});

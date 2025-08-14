// Test script to verify SIM cards table is working after the fix
// Run this in your browser console to test

async function testSimCardsFix() {
  console.log('🔧 Testing SIM cards table fix...');
  
  try {
    // Test 1: Check if table exists and has correct structure
    console.log('📋 Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('sim_cards')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Table structure test failed:', structureError);
      return false;
    }
    
    console.log('✅ Table structure test passed');
    console.log('📋 Available columns:', Object.keys(structureData[0] || {}));
    
    // Test 2: Check if current_user column exists
    if (structureData[0] && 'current_user' in structureData[0]) {
      console.log('✅ current_user column exists');
    } else {
      console.error('❌ current_user column missing');
      return false;
    }
    
    // Test 3: Test insert operation
    console.log('📝 Testing insert operation...');
    const testData = {
      sim_number: '+971999999999',
      package_name: 'Test Package',
      package_type: 'Default',
      package_benefits: 'Test benefits',
      monthly_cost: 100.00,
      data_limit: '5GB',
      voice_minutes: '500 minutes',
      sms_limit: '100 SMS',
      current_user: 'Test User',
      previous_user: '',
      department: 'IT',
      status: 'Active',
      activation_date: '2024-01-01',
      expiry_date: '2025-01-01',
      notes: 'Test record for verification'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('sim_cards')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return false;
    }
    
    console.log('✅ Insert test passed:', insertData);
    
    // Test 4: Test update operation
    console.log('✏️ Testing update operation...');
    const { data: updateData, error: updateError } = await supabase
      .from('sim_cards')
      .update({ current_user: 'Updated Test User' })
      .eq('sim_number', '+971999999999')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Update test failed:', updateError);
      return false;
    }
    
    console.log('✅ Update test passed:', updateData);
    
    // Test 5: Test delete operation (cleanup)
    console.log('🗑️ Testing delete operation...');
    const { error: deleteError } = await supabase
      .from('sim_cards')
      .delete()
      .eq('sim_number', '+971999999999');
    
    if (deleteError) {
      console.error('❌ Delete test failed:', deleteError);
      return false;
    }
    
    console.log('✅ Delete test passed');
    
    // Test 6: Test stats view
    console.log('📊 Testing stats view...');
    const { data: statsData, error: statsError } = await supabase
      .from('sim_card_stats')
      .select('*')
      .single();
    
    if (statsError) {
      console.error('❌ Stats view test failed:', statsError);
      return false;
    }
    
    console.log('✅ Stats view test passed:', statsData);
    
    console.log('\n🎉 All tests passed! SIM cards table is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Export for use in browser console
window.testSimCardsFix = testSimCardsFix;

console.log(`
📋 To test your SIM cards table fix, run this in your browser console:

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run: testSimCardsFix()

This will test:
- Table structure
- current_user column existence
- Insert operation
- Update operation
- Delete operation
- Stats view
`);

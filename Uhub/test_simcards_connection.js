// Test script to verify Supabase connection and sim_cards table
// Run this in your browser console to debug the issue

import { supabase } from './src/supabaseClient.js';

// Test 1: Check if we can connect to Supabase
async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('sim_cards')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
    
    console.log('✅ Connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
}

// Test 2: Check table structure
async function checkTableStructure() {
  console.log('🔍 Checking table structure...');
  
  try {
    const { data, error } = await supabase
      .from('sim_cards')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table structure check failed:', error);
      return;
    }
    
    console.log('✅ Table structure check passed');
    console.log('📋 Available columns:', Object.keys(data[0] || {}));
  } catch (error) {
    console.error('❌ Table structure error:', error);
  }
}

// Test 3: Try to insert a test record
async function testInsert() {
  console.log('🔍 Testing insert operation...');
  
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
    notes: 'Test record'
  };
  
  try {
    const { data, error } = await supabase
      .from('sim_cards')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Insert failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return false;
    }
    
    console.log('✅ Insert successful:', data);
    
    // Clean up - delete the test record
    await supabase
      .from('sim_cards')
      .delete()
      .eq('sim_number', '+971999999999');
    
    console.log('🧹 Test record cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Insert error:', error);
    return false;
  }
}

// Test 4: Check current user authentication
async function checkAuth() {
  console.log('🔍 Checking authentication...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth check failed:', error);
      return false;
    }
    
    if (user) {
      console.log('✅ User authenticated:', user.email);
      return true;
    } else {
      console.log('⚠️ No user authenticated');
      return false;
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting SIM cards database tests...\n');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Stopping tests due to connection failure');
    return;
  }
  
  await checkTableStructure();
  
  const authOk = await checkAuth();
  if (!authOk) {
    console.log('⚠️ User not authenticated - some operations may fail');
  }
  
  await testInsert();
  
  console.log('\n✅ All tests completed');
}

// Export for use in browser console
window.testSimCardsDB = runAllTests;

// Instructions for running the test:
console.log(`
📋 To test your SIM cards database, run this in your browser console:

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run: testSimCardsDB()

This will test:
- Supabase connection
- Table structure
- User authentication
- Insert operation
`);







// Test Dashboard Database Connection
// Run this with: node test_dashboard_connection.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (same as in your frontend)
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('expenses')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    
    console.log('✅ Basic connection successful!');
    
    // Test 2: Check expenses table
    console.log('\n2️⃣ Testing expenses table...');
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (expensesError) {
      console.error('❌ Expenses table error:', expensesError);
    } else {
      console.log('✅ Expenses table accessible!');
      console.log(`📊 Found ${expensesData?.length || 0} records`);
      if (expensesData && expensesData.length > 0) {
        console.log('📋 Sample record:', expensesData[0]);
      }
    }
    
    // Test 3: Check payments table
    console.log('\n3️⃣ Testing payments table...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(5);
    
    if (paymentsError) {
      console.error('❌ Payments table error:', paymentsError);
    } else {
      console.log('✅ Payments table accessible!');
      console.log(`📊 Found ${paymentsData?.length || 0} records`);
      if (paymentsData && paymentsData.length > 0) {
        console.log('📋 Sample record:', paymentsData[0]);
      }
    }
    
    // Test 4: Check table structure
    console.log('\n4️⃣ Checking table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Structure check failed:', structureError);
    } else if (structureData && structureData.length > 0) {
      console.log('✅ Table structure check passed!');
      console.log('📋 Available columns:', Object.keys(structureData[0]));
    }
    
    console.log('\n🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testConnection(); 
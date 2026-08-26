const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies on expenses table...');
    
    // Try to get table information
    const { data: tableInfo, error: tableError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing expenses table:', tableError);
      
      if (tableError.message.includes('row-level security policy')) {
        console.log('💡 RLS is enabled on the expenses table');
        console.log('💡 You need to either:');
        console.log('   1. Disable RLS temporarily for testing');
        console.log('   2. Create a proper RLS policy');
        console.log('   3. Use a service role key instead of anon key');
      }
      return;
    }
    
    console.log('✅ Successfully accessed expenses table');
    
    // Try to insert a test record
    const testRecord = {
      user_id: "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
      service_name: "TEST SERVICE",
      amount_aed: 100,
      currency: "AED",
      months: "TEST 2025",
      service_status: "active",
      date_paid: "2025-01-01",
      department: "TEST"
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('expenses')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
    } else {
      console.log('✅ Successfully inserted test record');
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('service_name', 'TEST SERVICE');
      
      if (deleteError) {
        console.error('❌ Error deleting test record:', deleteError);
      } else {
        console.log('✅ Successfully deleted test record');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
checkRLSPolicies();

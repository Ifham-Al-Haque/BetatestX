const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY (or REACT_APP_* equivalents) before running this script.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking expenses table structure...');
    
    // Try to get a sample record to see the structure
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching from expenses table:', error);
      
      // Try to check if the table exists
      console.log('\n📋 Checking if expenses table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('expenses')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Table might not exist:', tableError);
        return;
      }
    }

    if (data && data.length > 0) {
      console.log('✅ Table structure (sample record):');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('✅ Table exists but is empty');
    }

    // Try to get column information
    console.log('\n📋 Attempting to get column information...');
    
    // Try a simple insert with minimal fields to see what's required
    const testRecord = {
      amount_aed: 1000,
      date_paid: '2024-01-01',
      department: 'IT',
      service_name: 'Test Service'
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('expenses')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      console.log('💡 This helps us understand the required fields');
    } else {
      console.log('✅ Insert test successful');
      console.log('Inserted record:', JSON.stringify(insertTest[0], null, 2));
      
      // Clean up the test record
      if (insertTest[0] && insertTest[0].id) {
        await supabase
          .from('expenses')
          .delete()
          .eq('id', insertTest[0].id);
        console.log('🧹 Cleaned up test record');
      }
    }

  } catch (error) {
    console.error('❌ Error in checkTableStructure:', error);
  }
}

checkTableStructure();




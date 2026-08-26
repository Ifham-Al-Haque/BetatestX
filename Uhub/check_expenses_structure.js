const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExpensesStructure() {
  try {
    console.log('🔍 Checking expenses table structure...');
    
    // Fetch a sample record to see all columns
    const { data: sampleData, error: sampleError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error accessing expenses table:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('✅ Successfully connected to expenses table');
      console.log('📋 Current columns in expenses table:');
      
      const columns = Object.keys(sampleData[0]);
      columns.forEach(column => {
        console.log(`  - ${column}: ${typeof sampleData[0][column]}`);
      });
      
      // Check if invoice_number exists
      if (columns.includes('invoice_number')) {
        console.log('✅ invoice_number column already exists');
      } else {
        console.log('❌ invoice_number column does not exist');
        console.log('💡 You need to add this column manually in your Supabase dashboard');
      }
      
      // Show sample data
      console.log('\n📋 Sample expense record:');
      console.log(JSON.stringify(sampleData[0], null, 2));
      
    } else {
      console.log('⚠️ No data found in expenses table');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
checkExpensesStructure();

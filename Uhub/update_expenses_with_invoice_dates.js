const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY (or REACT_APP_* equivalents) before running this script.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExpensesWithInvoiceDates() {
  try {
    console.log('🔍 Updating expenses with invoice dates...');
    
    // First, let's check the current structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error accessing expenses table:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Current columns in expenses table:');
      const columns = Object.keys(sampleData[0]);
      columns.forEach(column => {
        console.log(`  - ${column}: ${typeof sampleData[0][column]}`);
      });
      
      // Check if new columns exist
      const hasGenerationDate = columns.includes('invoice_generation_date');
      const hasDueDate = columns.includes('invoice_due_date');
      
      console.log(`✅ invoice_generation_date column exists: ${hasGenerationDate}`);
      console.log(`✅ invoice_due_date column exists: ${hasDueDate}`);
      
      if (!hasGenerationDate || !hasDueDate) {
        console.log('💡 You need to run the SQL script first to add the new columns');
        console.log('   Run: add_invoice_dates_to_expenses.sql');
        return;
      }
    }
    
    // Get all expenses that need updating
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .or('invoice_generation_date.is.null,invoice_due_date.is.null');
    
    if (fetchError) {
      console.error('❌ Error fetching expenses:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${expenses.length} expenses that need date updates`);
    
    if (expenses.length === 0) {
      console.log('✅ All expenses already have invoice dates');
      return;
    }
    
    // Update expenses in batches
    const batchSize = 10;
    let updatedCount = 0;
    
    for (let i = 0; i < expenses.length; i += batchSize) {
      const batch = expenses.slice(i, i + batchSize);
      const updates = [];
      
      for (const expense of batch) {
        const update = {
          id: expense.id,
          invoice_generation_date: expense.invoice_generation_date || expense.date_paid,
          invoice_due_date: expense.invoice_due_date || 
            (expense.invoice_generation_date || expense.date_paid ? 
              new Date(expense.invoice_generation_date || expense.date_paid).toISOString().split('T')[0] : null)
        };
        
        // Add 30 days to generation date for due date if not set
        if (!expense.invoice_due_date && update.invoice_generation_date) {
          const genDate = new Date(update.invoice_generation_date);
          genDate.setDate(genDate.getDate() + 30);
          update.invoice_due_date = genDate.toISOString().split('T')[0];
        }
        
        updates.push(update);
      }
      
      // Update each expense individually to avoid batch update issues
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            invoice_generation_date: update.invoice_generation_date,
            invoice_due_date: update.invoice_due_date
          })
          .eq('id', update.id);
        
        if (updateError) {
          console.error(`❌ Error updating expense ${update.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
      
      console.log(`✅ Updated batch ${Math.floor(i/batchSize) + 1}: ${updates.length} expenses`);
    }
    
    console.log(`✅ Successfully updated ${updatedCount} expenses with invoice dates`);
    
    // Show sample of updated data
    const { data: updatedSample, error: sampleError2 } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (!sampleError2 && updatedSample) {
      console.log('\n📋 Sample updated expense records:');
      updatedSample.forEach((expense, index) => {
        console.log(`${index + 1}. ${expense.service_name}:`);
        console.log(`   - Invoice #: ${expense.invoice_number || 'N/A'}`);
        console.log(`   - Gen Date: ${expense.invoice_generation_date || 'N/A'}`);
        console.log(`   - Due Date: ${expense.invoice_due_date || 'N/A'}`);
        console.log(`   - Amount: AED ${expense.amount_aed}`);
      });
    }
    
    console.log('\n🎉 Invoice dates update complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
updateExpensesWithInvoiceDates();

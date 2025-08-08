const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addInvoiceNumberColumn() {
  try {
    console.log('🔍 Checking if invoice_number column exists...');
    
    // First, let's check the current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing expenses table:', tableError);
      return;
    }
    
    console.log('✅ Successfully connected to expenses table');
    
    // Check if invoice_number column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('expenses')
      .select('invoice_number')
      .limit(1);
    
    if (testError && testError.message.includes('column "invoice_number" does not exist')) {
      console.log('📝 Adding invoice_number column...');
      
      // Add the column using raw SQL
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE expenses 
          ADD COLUMN invoice_number VARCHAR(255);
        `
      });
      
      if (alterError) {
        console.error('❌ Error adding column:', alterError);
        return;
      }
      
      console.log('✅ Successfully added invoice_number column');
      
      // Update existing records with default invoice numbers
      console.log('🔄 Updating existing records with default invoice numbers...');
      
      const { data: existingExpenses, error: fetchError } = await supabase
        .from('expenses')
        .select('id, date_paid')
        .is('invoice_number', null);
      
      if (fetchError) {
        console.error('❌ Error fetching existing expenses:', fetchError);
        return;
      }
      
      console.log(`📊 Found ${existingExpenses.length} expenses to update`);
      
      // Update each expense with a default invoice number
      for (const expense of existingExpenses) {
        const date = new Date(expense.date_paid);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const id = String(expense.id).padStart(6, '0');
        const invoiceNumber = `INV-${year}-${month}-${id}`;
        
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ invoice_number: invoiceNumber })
          .eq('id', expense.id);
        
        if (updateError) {
          console.error(`❌ Error updating expense ${expense.id}:`, updateError);
        }
      }
      
      console.log('✅ Successfully updated all existing expenses with invoice numbers');
      
    } else if (testError) {
      console.error('❌ Unexpected error:', testError);
    } else {
      console.log('✅ invoice_number column already exists');
    }
    
    // Verify the column was added by fetching some data
    const { data: sampleData, error: sampleError } = await supabase
      .from('expenses')
      .select('id, service_name, invoice_number, date_paid')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
    } else {
      console.log('📋 Sample data with invoice numbers:');
      sampleData.forEach(expense => {
        console.log(`  - ${expense.service_name}: ${expense.invoice_number || 'N/A'} (${expense.date_paid})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
addInvoiceNumberColumn();

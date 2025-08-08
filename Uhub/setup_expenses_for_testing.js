const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Real expense data from the user (first 10 records for testing)
const realExpenses = [
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 263,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-28",
    "department": "SUBSCRIBE NOW",
    "invoice_number": "INV-2025-05-000001"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 955,
    "currency": "AED",
    "months": "JULY 2024",
    "service_status": "active",
    "date_paid": "2024-07-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-07-000002"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1131,
    "currency": "AED",
    "months": "OCTOBER 2024",
    "service_status": "active",
    "date_paid": "2024-10-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-10-000003"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1954,
    "currency": "AED",
    "months": "JANUARY 2025",
    "service_status": "active",
    "date_paid": "2025-01-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-01-000004"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1957,
    "currency": "AED",
    "months": "APRIL 2025",
    "service_status": "active",
    "date_paid": "2025-04-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-04-000005"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS[BESPIN]",
    "amount_aed": 25855,
    "currency": "AED",
    "months": "FEBRUARY 2024",
    "service_status": "active",
    "date_paid": "2024-02-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-02-000006"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 18965,
    "currency": "AED",
    "months": "MAY 2024",
    "service_status": "active",
    "date_paid": "2024-05-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-05-000007"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS[BESPIN]",
    "amount_aed": 18536,
    "currency": "AED",
    "months": "AUGUST 2024",
    "service_status": "active",
    "date_paid": "2024-08-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-08-000008"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS[BESPIN]",
    "amount_aed": 17355,
    "currency": "AED",
    "months": "NOVEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-11-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-11-000009"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 17136,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-02-000010"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 20456,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-05-000011"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 110,
    "currency": "AED",
    "months": "JANUARY 2025",
    "service_status": "active",
    "date_paid": "2025-01-01",
    "department": "SUBSCRIBE NOW",
    "invoice_number": "INV-2025-01-000012"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "RETOOL",
    "amount_aed": 227,
    "currency": "AED",
    "months": "JUNE 2025",
    "service_status": "final",
    "date_paid": "2025-06-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-06-000013"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 110,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-10",
    "department": "SUBSCRIBE NOW",
    "invoice_number": "INV-2025-02-000014"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 110,
    "currency": "AED",
    "months": "MARCH 2025",
    "service_status": "active",
    "date_paid": "2025-03-10",
    "department": "SUBSCRIBE NOW",
    "invoice_number": "INV-2025-03-000015"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 287,
    "currency": "AED",
    "months": "JUNE 2025",
    "service_status": "active",
    "date_paid": "2025-06-28",
    "department": "SUBSCRIBE NOW",
    "invoice_number": "INV-2025-06-000016"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1055,
    "currency": "AED",
    "months": "AUGUST 2024",
    "service_status": "active",
    "date_paid": "2024-08-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-08-000017"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 2232,
    "currency": "AED",
    "months": "NOVEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-11-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-11-000018"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 2078,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-02-000019"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1957,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-08",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-05-000020"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 27256,
    "currency": "AED",
    "months": "MARCH 2024",
    "service_status": "active",
    "date_paid": "2024-03-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-03-000021"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "CLOUDFLARE",
    "amount_aed": 918,
    "currency": "AED",
    "months": "JANUARY 2025",
    "service_status": "active",
    "date_paid": "2025-01-17",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-01-000022"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 22922,
    "currency": "AED",
    "months": "JUNE 2024",
    "service_status": "active",
    "date_paid": "2024-06-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-06-000023"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 17791,
    "currency": "AED",
    "months": "SEPTEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-09-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-09-000024"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "CLOUDFLARE",
    "amount_aed": 918,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-17",
    "department": "TECHNOLOGY ",
    "invoice_number": "INV-2025-02-000025"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 18053,
    "currency": "AED",
    "months": "DECEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-12-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2024-12-000026"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 19649,
    "currency": "AED",
    "months": "MARCH 2025",
    "service_status": "active",
    "date_paid": "2025-03-01",
    "department": "TECHNOLOGY",
    "invoice_number": "INV-2025-03-000027"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "FRESHDESK",
    "amount_aed": 8328,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-06",
    "department": "CUSTOMER SERVICE",
    "invoice_number": "INV-2025-05-000028"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "FRESHDESK",
    "amount_aed": 9172,
    "currency": "AED",
    "months": "JUNE 2025",
    "service_status": "active",
    "date_paid": "2025-06-06",
    "department": "CUSTOMER SERVICE ",
    "invoice_number": "INV-2025-06-000029"
  },
  {
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "FRESHDESK",
    "amount_aed": 9172,
    "currency": "AED",
    "months": "JULY 2025",
    "service_status": "active",
    "date_paid": "2025-07-06",
    "department": "CUSTOMER SERVICE",
    "invoice_number": "INV-2025-07-000030"
  }
];

async function setupExpensesForTesting() {
  try {
    console.log('🔍 Setting up expenses table for testing...');
    
    // First, let's see if there's any existing data
    const { data: existingData, error: existingError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (existingError) {
      console.error('❌ Error accessing expenses table:', existingError);
      console.log('💡 You need to run the SQL script to disable RLS first:');
      console.log('   ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;');
      return;
    }
    
    console.log(`📊 Found ${existingData.length} existing expenses`);
    
    if (existingData.length === 0) {
      console.log('📝 Inserting test expense data...');
      
      // Insert data in batches
      const batchSize = 5;
      let insertedCount = 0;
      
      for (let i = 0; i < realExpenses.length; i += batchSize) {
        const batch = realExpenses.slice(i, i + batchSize);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('expenses')
          .insert(batch)
          .select();
        
        if (insertError) {
          console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
          continue;
        }
        
        insertedCount += insertedData.length;
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedData.length} expenses`);
      }
      
      console.log(`✅ Successfully inserted ${insertedCount} test expenses`);
    } else {
      console.log('✅ Test data already exists');
    }
    
    // Now let's check the table structure and show sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Current columns in expenses table:');
      
      const columns = Object.keys(sampleData[0]);
      columns.forEach(column => {
        console.log(`  - ${column}: ${typeof sampleData[0][column]}`);
      });
      
      // Check if invoice_number exists
      if (columns.includes('invoice_number')) {
        console.log('✅ invoice_number column exists');
      } else {
        console.log('❌ invoice_number column does not exist');
        console.log('💡 You need to add this column manually in your Supabase dashboard');
      }
      
      // Show sample data
      console.log('\n📋 Sample expense records:');
      sampleData.forEach((expense, index) => {
        console.log(`${index + 1}. ${expense.service_name}: AED ${expense.amount_aed} (${expense.department}) - ${expense.invoice_number || 'N/A'}`);
      });
      
      // Show summary statistics
      console.log('\n📊 Summary Statistics:');
      const { data: totalExpenses, error: countError } = await supabase
        .from('expenses')
        .select('*');
      
      if (!countError && totalExpenses) {
        const totalAmount = totalExpenses.reduce((sum, exp) => sum + (exp.amount_aed || 0), 0);
        const departments = [...new Set(totalExpenses.map(exp => exp.department).filter(Boolean))];
        const services = [...new Set(totalExpenses.map(exp => exp.service_name).filter(Boolean))];
        const statuses = [...new Set(totalExpenses.map(exp => exp.service_status).filter(Boolean))];
        
        console.log(`  - Total expenses: ${totalExpenses.length}`);
        console.log(`  - Total amount: AED ${totalAmount.toLocaleString()}`);
        console.log(`  - Departments: ${departments.length} (${departments.join(', ')})`);
        console.log(`  - Services: ${services.length}`);
        console.log(`  - Statuses: ${statuses.join(', ')}`);
      }
      
      console.log('\n🎉 Setup complete! You can now test the filter functionality and invoice number feature.');
      console.log('💡 Remember to re-enable RLS when done testing:');
      console.log('   ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
setupExpensesForTesting();

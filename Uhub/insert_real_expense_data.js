const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://qtugowosurgecytgswuo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Real expense data from the user
const realExpenses = [
  {
    "id": "c4780e4d-3ff4-4712-ba9d-0c29b1e11d49",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 263,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-28",
    "created_at": "2025-07-28 08:58:10.051628+00",
    "department": "SUBSCRIBE NOW"
  },
  {
    "id": "f45ca8da-060d-4b93-b6bc-8b7cd49c182a",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 955,
    "currency": "AED",
    "months": "JULY 2024",
    "service_status": "active",
    "date_paid": "2024-07-08",
    "created_at": "2025-07-28 10:51:23.926032+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "31292ba4-07fa-41f9-b3d2-dad6dba20586",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1131,
    "currency": "AED",
    "months": "OCTOBER 2024",
    "service_status": "active",
    "date_paid": "2024-10-08",
    "created_at": "2025-07-28 10:58:12.237597+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "7a74f208-abb5-4686-9544-8290f6d9dfc3",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1954,
    "currency": "AED",
    "months": "JANUARY 2025",
    "service_status": "active",
    "date_paid": "2025-01-08",
    "created_at": "2025-07-28 11:02:13.745343+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "71a66676-da59-41e1-ac68-f0c19c81b30a",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1957,
    "currency": "AED",
    "months": "APRIL 2025",
    "service_status": "active",
    "date_paid": "2025-04-08",
    "created_at": "2025-07-28 11:30:07.64162+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "7e682ad5-1ee6-4a18-85f6-347c609cb6a6",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS[BESPIN]",
    "amount_aed": 25855,
    "currency": "AED",
    "months": "FEBRUARY 2024",
    "service_status": "active",
    "date_paid": "2024-02-01",
    "created_at": "2025-07-28 13:10:31.782833+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "3d0f4da8-0463-4afd-82b6-89cd7108add7",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 18965,
    "currency": "AED",
    "months": "MAY 2024",
    "service_status": "active",
    "date_paid": "2024-05-01",
    "created_at": "2025-07-28 13:13:45.223461+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "6a494b2a-2366-447c-a2bd-8988c7334f35",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS[BESPIN]",
    "amount_aed": 18536,
    "currency": "AED",
    "months": "AUGUST 2024",
    "service_status": "active",
    "date_paid": "2024-08-01",
    "created_at": "2025-07-28 13:25:02.37905+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "225db208-3b65-41a3-b852-ebb80e10649a",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS[BESPIN]",
    "amount_aed": 17355,
    "currency": "AED",
    "months": "NOVEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-11-01",
    "created_at": "2025-07-28 14:01:50.81321+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "06ee7285-28c3-426d-bbbe-fa1e229f10f5",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 17136,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-01",
    "created_at": "2025-07-28 14:35:52.1344+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "84e2f5aa-5022-4dcd-9c15-e7a0034ca575",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 20456,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-01",
    "created_at": "2025-07-28 14:39:45.124115+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "f947826d-9ff2-4786-811c-929986248816",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 110,
    "currency": "AED",
    "months": "JANUARY 2025",
    "service_status": "active",
    "date_paid": "2025-01-01",
    "created_at": "2025-07-28 08:50:17.905477+00",
    "department": "SUBSCRIBE NOW"
  },
  {
    "id": "ad1ec858-b449-4820-abaf-fbf66276bed0",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "RETOOL",
    "amount_aed": 227,
    "currency": "AED",
    "months": "JUNE 2025",
    "service_status": "final",
    "date_paid": "2025-06-08",
    "created_at": "2025-07-18 06:48:15.37151+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "23752104-125c-4908-a356-537b8a21d4d5",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 110,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-10",
    "created_at": "2025-07-28 08:53:35.79397+00",
    "department": "SUBSCRIBE NOW"
  },
  {
    "id": "d6aea05d-2c95-43a7-a16c-7e7fa93f9911",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 110,
    "currency": "AED",
    "months": "MARCH 2025",
    "service_status": "active",
    "date_paid": "2025-03-10",
    "created_at": "2025-07-28 08:54:05.99354+00",
    "department": "SUBSCRIBE NOW"
  },
  {
    "id": "6af17ff8-621f-4d81-b292-b995805eb0ae",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ZAIPER",
    "amount_aed": 287,
    "currency": "AED",
    "months": "JUNE 2025",
    "service_status": "active",
    "date_paid": "2025-06-28",
    "created_at": "2025-07-28 08:59:05.53829+00",
    "department": "SUBSCRIBE NOW"
  },
  {
    "id": "d77aca4e-0a7a-4872-8de2-4b1752860f58",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1055,
    "currency": "AED",
    "months": "AUGUST 2024",
    "service_status": "active",
    "date_paid": "2024-08-08",
    "created_at": "2025-07-28 10:53:01.145966+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "d6bdf9bf-070c-4c96-b636-e8757d28499c",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 2232,
    "currency": "AED",
    "months": "NOVEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-11-08",
    "created_at": "2025-07-28 10:59:20.321802+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "d7a457e8-fb77-42db-8906-6e1805e72289",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 2078,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-08",
    "created_at": "2025-07-28 11:03:26.885802+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "68bf052a-e664-45cb-8f22-0eb587c59093",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "ATLASSIAN [JIRA & CONFLUENCE]",
    "amount_aed": 1957,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-08",
    "created_at": "2025-07-28 11:32:46.598704+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "a09cc6dc-fda2-4da2-8378-09f7c89308f1",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 27256,
    "currency": "AED",
    "months": "MARCH 2024",
    "service_status": "active",
    "date_paid": "2024-03-01",
    "created_at": "2025-07-28 13:11:43.402248+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "4d3ac386-feed-4dc1-bb5a-bb0e7335b901",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "CLOUDFLARE",
    "amount_aed": 918,
    "currency": "AED",
    "months": "JANUARY 2025",
    "service_status": "active",
    "date_paid": "2025-01-17",
    "created_at": "2025-07-24 12:47:20.050381+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "74817a95-590f-4c3e-baea-6a776990ba8e",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 22922,
    "currency": "AED",
    "months": "JUNE 2024",
    "service_status": "active",
    "date_paid": "2024-06-01",
    "created_at": "2025-07-28 13:15:54.528925+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "2cd36c29-8ddf-405f-a5c0-c17ec25944c0",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 17791,
    "currency": "AED",
    "months": "SEPTEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-09-01",
    "created_at": "2025-07-28 13:46:31.625069+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "1933b45e-c397-4cd1-8bb3-dddd2e0552cd",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "CLOUDFLARE",
    "amount_aed": 918,
    "currency": "AED",
    "months": "FEBRUARY 2025",
    "service_status": "active",
    "date_paid": "2025-02-17",
    "created_at": "2025-07-24 12:47:58.358691+00",
    "department": "TECHNOLOGY "
  },
  {
    "id": "8530f6c5-fdcd-45bb-b8d1-5865f8d25004",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 18053,
    "currency": "AED",
    "months": "DECEMBER 2024",
    "service_status": "active",
    "date_paid": "2024-12-01",
    "created_at": "2025-07-28 14:33:28.648073+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "42966845-d2a6-486a-960f-f2a1c04c9ff7",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "AWS [BESPIN]",
    "amount_aed": 19649,
    "currency": "AED",
    "months": "MARCH 2025",
    "service_status": "active",
    "date_paid": "2025-03-01",
    "created_at": "2025-07-28 14:37:11.435379+00",
    "department": "TECHNOLOGY"
  },
  {
    "id": "833109c7-3594-4376-b2a8-c57e50a84749",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "FRESHDESK",
    "amount_aed": 8328,
    "currency": "AED",
    "months": "MAY 2025",
    "service_status": "active",
    "date_paid": "2025-05-06",
    "created_at": "2025-07-18 10:56:15.769609+00",
    "department": "CUSTOMER SERVICE"
  },
  {
    "id": "e31a235f-a99e-4fa8-b436-229c3c95a81d",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "FRESHDESK",
    "amount_aed": 9172,
    "currency": "AED",
    "months": "JUNE 2025",
    "service_status": "active",
    "date_paid": "2025-06-06",
    "created_at": "2025-07-18 11:04:47.456784+00",
    "department": "CUSTOMER SERVICE "
  },
  {
    "id": "1a9c8cd8-03fc-4eac-b33e-568f2068d42a",
    "user_id": "24e0b410-74d9-4ce1-a8b1-b26aa35850e0",
    "service_name": "FRESHDESK",
    "amount_aed": 9172,
    "currency": "AED",
    "months": "JULY 2025",
    "service_status": "active",
    "date_paid": "2025-07-06",
    "created_at": "2025-07-18 11:05:22.11605+00",
    "department": "CUSTOMER SERVICE"
  }
];

async function insertRealExpenseData() {
  try {
    console.log('🔍 Checking current expenses table...');
    
    // First, let's see if there's any existing data
    const { data: existingData, error: existingError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5);
    
    if (existingError) {
      console.error('❌ Error accessing expenses table:', existingError);
      return;
    }
    
    console.log(`📊 Found ${existingData.length} existing expenses`);
    
    if (existingData.length === 0) {
      console.log('📝 Inserting real expense data...');
      
      // Insert data in batches to avoid overwhelming the database
      const batchSize = 10;
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
      
      console.log(`✅ Successfully inserted ${insertedCount} real expenses`);
    } else {
      console.log('✅ Real data already exists');
    }
    
    // Now let's check the table structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
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
        console.log('✅ invoice_number column already exists');
      } else {
        console.log('❌ invoice_number column does not exist');
        console.log('💡 You need to add this column manually in your Supabase dashboard');
        console.log('💡 SQL command to run:');
        console.log('   ALTER TABLE expenses ADD COLUMN invoice_number VARCHAR(255);');
      }
      
      // Show sample data
      console.log('\n📋 Sample expense records:');
      const { data: allExpenses, error: fetchError } = await supabase
        .from('expenses')
        .select('service_name, amount_aed, department, date_paid')
        .limit(10);
      
      if (!fetchError && allExpenses) {
        allExpenses.forEach((expense, index) => {
          console.log(`${index + 1}. ${expense.service_name}: AED ${expense.amount_aed} (${expense.department}) - ${expense.date_paid}`);
        });
      }
      
      // Show summary statistics
      console.log('\n📊 Summary Statistics:');
      const { data: totalExpenses, error: countError } = await supabase
        .from('expenses')
        .select('*');
      
      if (!countError && totalExpenses) {
        const totalAmount = totalExpenses.reduce((sum, exp) => sum + (exp.amount_aed || 0), 0);
        const departments = [...new Set(totalExpenses.map(exp => exp.department).filter(Boolean))];
        const services = [...new Set(totalExpenses.map(exp => exp.service_name).filter(Boolean))];
        
        console.log(`  - Total expenses: ${totalExpenses.length}`);
        console.log(`  - Total amount: AED ${totalAmount.toLocaleString()}`);
        console.log(`  - Departments: ${departments.length} (${departments.join(', ')})`);
        console.log(`  - Services: ${services.length}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
insertRealExpenseData();

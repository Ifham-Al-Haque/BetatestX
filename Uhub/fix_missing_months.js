const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qtugowosurgecytgswuo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM'
);

// Data for missing months based on the chart pattern
const missingMonthsData = [
  // February 2024 - ~32,000 (based on chart trend)
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2024-02-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Office Furniture', amount_aed: 12000, date_paid: '2024-02-05', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },
  { title: 'Marketing Materials', amount_aed: 8000, date_paid: '2024-02-10', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' },
  { title: 'Server Maintenance', amount_aed: 10000, date_paid: '2024-02-15', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },

  // April 2024 - ~30,000
  { title: 'Cloud Storage', amount_aed: 10000, date_paid: '2024-04-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-04-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Software Renewal', amount_aed: 15000, date_paid: '2024-04-20', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },

  // June 2024 - ~28,000
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-06-01', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Cloud Services', amount_aed: 8000, date_paid: '2024-06-15', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Training Program', amount_aed: 15000, date_paid: '2024-06-20', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },

  // August 2024 - ~27,000
  { title: 'Cloud Storage', amount_aed: 10000, date_paid: '2024-08-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-08-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Server Maintenance', amount_aed: 12000, date_paid: '2024-08-20', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },

  // October 2024 - ~30,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2024-10-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Cloud Services', amount_aed: 8000, date_paid: '2024-10-15', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Furniture', amount_aed: 20000, date_paid: '2024-10-20', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },

  // December 2024 - ~40,000
  { title: 'Cloud Storage', amount_aed: 12000, date_paid: '2024-12-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Supplies', amount_aed: 8000, date_paid: '2024-12-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Training Program', amount_aed: 20000, date_paid: '2024-12-20', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },

  // February 2025 - ~90,000
  { title: 'Server Infrastructure', amount_aed: 35000, date_paid: '2025-02-01', department: 'IT', service_name: 'Hardware', vendor: 'TechCorp' },
  { title: 'Office Equipment', amount_aed: 25000, date_paid: '2025-02-15', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },
  { title: 'Training Programs', amount_aed: 30000, date_paid: '2025-02-20', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },

  // April 2025 - ~75,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2025-04-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Office Supplies', amount_aed: 8000, date_paid: '2025-04-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Server Maintenance', amount_aed: 20000, date_paid: '2025-04-20', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },
  { title: 'Training Program', amount_aed: 25000, date_paid: '2025-04-25', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  { title: 'Marketing Materials', amount_aed: 20000, date_paid: '2025-04-30', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' },

  // June 2025 - ~45,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2025-06-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2025-06-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Server Maintenance', amount_aed: 15000, date_paid: '2025-06-20', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },
  { title: 'Training Program', amount_aed: 15000, date_paid: '2025-06-25', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  { title: 'Marketing Materials', amount_aed: 8000, date_paid: '2025-06-30', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' }
];

async function insertMissingMonthsData() {
  try {
    console.log('📊 Inserting data for missing months...');
    
    // First, check if we need to disable RLS temporarily
    console.log('🔓 Attempting to disable RLS for data insertion...');
    
    // Try to insert the data
    const { data, error } = await supabase
      .from('expenses')
      .insert(missingMonthsData);

    if (error) {
      console.error('❌ Error inserting data:', error);
      
      if (error.message.includes('row-level security')) {
        console.log('💡 RLS is blocking the insertion. You may need to:');
        console.log('   1. Run this SQL in your Supabase dashboard:');
        console.log('      ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;');
        console.log('   2. Then run this script again');
        console.log('   3. Re-enable RLS after:');
        console.log('      ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;');
      }
      return;
    }

    console.log(`✅ Successfully inserted ${missingMonthsData.length} records for missing months`);
    
    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('expenses')
      .select('*')
      .order('date_paid', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    console.log(`✅ Total records in database: ${verifyData?.length || 0}`);
    
    // Show monthly totals
    const monthlyTotals = {};
    verifyData.forEach(expense => {
      const monthKey = new Date(expense.date_paid).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (expense.amount_aed || 0);
    });

    console.log('\n💰 Monthly totals after insertion:');
    Object.entries(monthlyTotals)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .forEach(([month, total]) => {
        console.log(`  ${month}: AED ${total.toLocaleString()}`);
      });

    console.log('\n🎉 Missing months data insertion complete!');
    console.log('💡 Refresh your dashboard to see the updated chart with all months.');

  } catch (error) {
    console.error('❌ Error in insertMissingMonthsData:', error);
  }
}

insertMissingMonthsData();

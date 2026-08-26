const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY (or REACT_APP_* equivalents) before running this script.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data based on the chart image showing expenses from Jan 2024 to Jul 2025
const sampleExpenses = [
  // January 2024 - ~28,000
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-01-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Cloud Services', amount_aed: 8000, date_paid: '2024-01-20', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Software Licenses', amount_aed: 15000, date_paid: '2024-01-25', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  
  // February 2024 - ~32,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2024-02-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Office Furniture', amount_aed: 12000, date_paid: '2024-02-05', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },
  { title: 'Marketing Materials', amount_aed: 8000, date_paid: '2024-02-10', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' },
  { title: 'Server Maintenance', amount_aed: 10000, date_paid: '2024-02-15', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },
  
  // March 2024 - ~35,000
  { title: 'Training Program', amount_aed: 15000, date_paid: '2024-03-01', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  { title: 'Security Software', amount_aed: 8000, date_paid: '2024-03-05', department: 'IT', service_name: 'Security', vendor: 'Norton' },
  { title: 'Conference Tickets', amount_aed: 12000, date_paid: '2024-03-10', department: 'Marketing', service_name: 'Events', vendor: 'TechConf' },
  
  // April 2024 - ~30,000
  { title: 'Cloud Storage', amount_aed: 10000, date_paid: '2024-04-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-04-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Software Renewal', amount_aed: 15000, date_paid: '2024-04-20', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  
  // May 2024 - ~30,019 (as shown in chart)
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2024-05-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Marketing Campaign', amount_aed: 15000, date_paid: '2024-05-10', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' },
  { title: 'Server Upgrade', amount_aed: 13019, date_paid: '2024-05-20', department: 'IT', service_name: 'Hardware', vendor: 'TechCorp' },
  
  // June 2024 - ~28,000
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-06-01', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Cloud Services', amount_aed: 8000, date_paid: '2024-06-15', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Training Program', amount_aed: 15000, date_paid: '2024-06-20', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  
  // July 2024 - ~26,000
  { title: 'Software Licenses', amount_aed: 12000, date_paid: '2024-07-01', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2024-07-15', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Marketing Materials', amount_aed: 12000, date_paid: '2024-07-20', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' },
  
  // August 2024 - ~27,000
  { title: 'Cloud Storage', amount_aed: 10000, date_paid: '2024-08-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2024-08-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Server Maintenance', amount_aed: 12000, date_paid: '2024-08-20', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },
  
  // September 2024 - ~28,000
  { title: 'Software Licenses', amount_aed: 15000, date_paid: '2024-09-01', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Training Program', amount_aed: 8000, date_paid: '2024-09-15', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  { title: 'Marketing Campaign', amount_aed: 5000, date_paid: '2024-09-20', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' },
  
  // October 2024 - ~30,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2024-10-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Cloud Services', amount_aed: 8000, date_paid: '2024-10-15', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Furniture', amount_aed: 20000, date_paid: '2024-10-20', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },
  
  // November 2024 - ~45,000
  { title: 'Software Licenses', amount_aed: 20000, date_paid: '2024-11-01', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Server Upgrade', amount_aed: 15000, date_paid: '2024-11-15', department: 'IT', service_name: 'Hardware', vendor: 'TechCorp' },
  { title: 'Marketing Campaign', amount_aed: 10000, date_paid: '2024-11-20', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' },
  
  // December 2024 - ~40,000
  { title: 'Cloud Storage', amount_aed: 12000, date_paid: '2024-12-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Office Supplies', amount_aed: 8000, date_paid: '2024-12-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Training Program', amount_aed: 20000, date_paid: '2024-12-20', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  
  // January 2025 - ~95,000
  { title: 'Annual Software Licenses', amount_aed: 40000, date_paid: '2025-01-01', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Cloud Infrastructure', amount_aed: 25000, date_paid: '2025-01-15', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Marketing Campaign', amount_aed: 30000, date_paid: '2025-01-20', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' },
  
  // February 2025 - ~90,000
  { title: 'Server Infrastructure', amount_aed: 35000, date_paid: '2025-02-01', department: 'IT', service_name: 'Hardware', vendor: 'TechCorp' },
  { title: 'Office Equipment', amount_aed: 25000, date_paid: '2025-02-15', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },
  { title: 'Training Programs', amount_aed: 30000, date_paid: '2025-02-20', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  
  // March 2025 - ~98,000
  { title: 'Annual Cloud Services', amount_aed: 40000, date_paid: '2025-03-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Software Licenses', amount_aed: 30000, date_paid: '2025-03-15', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Marketing Campaign', amount_aed: 28000, date_paid: '2025-03-20', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' },
  
  // April 2025 - ~75,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2025-04-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Office Supplies', amount_aed: 8000, date_paid: '2025-04-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Server Maintenance', amount_aed: 20000, date_paid: '2025-04-20', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },
  { title: 'Training Program', amount_aed: 25000, date_paid: '2025-04-25', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  { title: 'Marketing Materials', amount_aed: 20000, date_paid: '2025-04-30', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' },
  
  // May 2025 - ~60,000
  { title: 'Cloud Storage', amount_aed: 15000, date_paid: '2025-05-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Software Licenses', amount_aed: 20000, date_paid: '2025-05-15', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Office Furniture', amount_aed: 15000, date_paid: '2025-05-20', department: 'HR', service_name: 'Furniture', vendor: 'IKEA' },
  { title: 'Marketing Campaign', amount_aed: 10000, date_paid: '2025-05-25', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' },
  
  // June 2025 - ~45,000
  { title: 'Internet Service', amount_aed: 2000, date_paid: '2025-06-01', department: 'IT', service_name: 'Internet', vendor: 'Etisalat' },
  { title: 'Office Supplies', amount_aed: 5000, date_paid: '2025-06-15', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Server Maintenance', amount_aed: 15000, date_paid: '2025-06-20', department: 'IT', service_name: 'Maintenance', vendor: 'TechCorp' },
  { title: 'Training Program', amount_aed: 15000, date_paid: '2025-06-25', department: 'HR', service_name: 'Training', vendor: 'SkillUp' },
  { title: 'Marketing Materials', amount_aed: 8000, date_paid: '2025-06-30', department: 'Marketing', service_name: 'Marketing', vendor: 'PrintShop' },
  
  // July 2025 - ~38,000
  { title: 'Cloud Services', amount_aed: 10000, date_paid: '2025-07-01', department: 'IT', service_name: 'Cloud Services', vendor: 'AWS' },
  { title: 'Software Licenses', amount_aed: 15000, date_paid: '2025-07-15', department: 'IT', service_name: 'Software License', vendor: 'Microsoft' },
  { title: 'Office Supplies', amount_aed: 3000, date_paid: '2025-07-20', department: 'IT', service_name: 'Office Supplies', vendor: 'OfficeMax' },
  { title: 'Marketing Campaign', amount_aed: 10000, date_paid: '2025-07-25', department: 'Marketing', service_name: 'Marketing', vendor: 'DigitalAds' }
];

async function insertSampleData() {
  try {
    console.log('📊 Inserting sample expense data...');
    
    // First, check if data already exists
    const { data: existingData, error: checkError } = await supabase
      .from('expenses')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log('⚠️  Data already exists in expenses table. Skipping insertion.');
      return;
    }

    // Insert sample data
    const { data, error } = await supabase
      .from('expenses')
      .insert(sampleExpenses);

    if (error) {
      console.error('❌ Error inserting sample data:', error);
      return;
    }

    console.log(`✅ Successfully inserted ${sampleExpenses.length} expense records`);
    
    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('expenses')
      .select('*')
      .order('date_paid', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    console.log(`✅ Verified ${verifyData?.length || 0} records in database`);
    
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

    console.log('\n🎉 Sample data insertion complete!');
    console.log('💡 Refresh your dashboard to see the updated chart with all months.');

  } catch (error) {
    console.error('❌ Error in insertSampleData:', error);
  }
}

insertSampleData();

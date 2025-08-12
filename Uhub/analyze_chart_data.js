const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qtugowosurgecytgswuo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM'
);

async function analyzeChartData() {
  try {
    console.log('📊 Analyzing chart data and identifying missing months...');
    
    // First, let's check if there's any data in the expenses table
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date_paid', { ascending: true });

    if (expensesError) {
      console.error('❌ Error fetching expenses:', expensesError);
      return;
    }

    console.log(`✅ Found ${expensesData?.length || 0} expense records`);

    if (!expensesData || expensesData.length === 0) {
      console.log('❌ No expense data found. Let\'s check if we need to insert sample data...');
      
      // Check if the table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('expenses')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Table might not exist:', tableError);
        return;
      }
      
      console.log('✅ Expenses table exists but is empty');
      console.log('💡 You may need to run the sample data insertion from fix_dashboard_data_loading.sql');
      return;
    }

    // Process the data similar to how the chart component does
    const monthlyData = {};
    const serviceBreakdown = {};

    expensesData.forEach(expense => {
      if (expense.date_paid && expense.amount_aed) {
        const date = new Date(expense.date_paid);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const amount = Number(expense.amount_aed) || 0;
        const service = expense.service_name || 'Unknown';

        // Monthly totals
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;

        // Service breakdown
        if (!serviceBreakdown[monthKey]) serviceBreakdown[monthKey] = {};
        serviceBreakdown[monthKey][service] = (serviceBreakdown[monthKey][service] || 0) + amount;
      }
    });

    // Get all available months
    const availableMonths = Object.keys(monthlyData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    console.log('\n📅 Available months in database:');
    availableMonths.forEach(month => {
      const total = monthlyData[month];
      console.log(`  - ${month}: AED ${total.toLocaleString()}`);
    });

    // Based on the chart image description, the expected range is Jan 2024 to Jul 2025
    const expectedMonths = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-07-01');
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      expectedMonths.push(monthKey);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    console.log('\n📋 Expected months (Jan 2024 - Jul 2025):');
    expectedMonths.forEach(month => console.log(`  - ${month}`));

    // Find missing months
    const missingMonths = expectedMonths.filter(month => !availableMonths.includes(month));
    
    if (missingMonths.length > 0) {
      console.log('\n❌ Missing months in database:');
      missingMonths.forEach(month => console.log(`  - ${month}`));
      console.log(`\nTotal missing months: ${missingMonths.length}`);
    } else {
      console.log('\n✅ All expected months are present in the database');
    }

    // Show what the chart would display
    console.log('\n📊 Chart display analysis:');
    console.log('Based on the chart image, these months are visible:');
    console.log('  - Jan 2024, Mar 2024, May 2024, Jul 2024, Sep 2024, Nov 2024');
    console.log('  - Jan 2025, Mar 2025, May 2025, Jul 2025');
    
    const chartVisibleMonths = [
      'Jan 2024', 'Mar 2024', 'May 2024', 'Jul 2024', 'Sep 2024', 'Nov 2024',
      'Jan 2025', 'Mar 2025', 'May 2025', 'Jul 2025'
    ];
    
    const missingInChart = expectedMonths.filter(month => !chartVisibleMonths.includes(month));
    console.log('\n❌ Months missing from chart display:');
    missingInChart.forEach(month => console.log(`  - ${month}`));

    // Check if the chart component is filtering data
    console.log('\n🔍 Chart component analysis:');
    console.log('The InteractiveExpenseChart component processes data as follows:');
    console.log('1. Fetches all expenses from database');
    console.log('2. Groups by month using date_paid field');
    console.log('3. Creates monthly totals');
    console.log('4. Displays as bar chart');
    
    if (missingMonths.length > 0) {
      console.log('\n💡 To fix missing months:');
      console.log('1. Add expense records for the missing months');
      console.log('2. Ensure date_paid field is properly set');
      console.log('3. Check if RLS policies are blocking data access');
    }

    // Show sample data structure
    if (expensesData.length > 0) {
      console.log('\n📝 Sample expense record structure:');
      const sample = expensesData[0];
      console.log(JSON.stringify(sample, null, 2));
    }

  } catch (error) {
    console.error('❌ Error in analyzeChartData:', error);
  }
}

analyzeChartData();




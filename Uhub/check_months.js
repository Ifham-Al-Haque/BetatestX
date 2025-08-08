const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qtugowosurgecytgswuo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dWdvd29zdXJnZWN5dGdzd3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI4OTUsImV4cCI6MjA2NTM3ODg5NX0.x4gN4YO9xalo9y506l_mf6pzK_Km-SCVf9fuJxjyMLM'
);

async function checkMonths() {
  try {
    console.log('📊 Fetching expense data to check available months...');
    
    const { data, error } = await supabase
      .from('expenses')
      .select('date_paid, amount_aed')
      .order('date_paid', { ascending: true });

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    console.log(`✅ Loaded ${data?.length || 0} expense records`);

    if (!data || data.length === 0) {
      console.log('❌ No expense data found in database');
      return;
    }

    // Get unique months
    const months = [...new Set(data.map(exp => {
      const date = new Date(exp.date_paid);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }))];

    console.log('\n📅 Available months in database:');
    months.forEach(month => console.log(`  - ${month}`));
    console.log(`\nTotal unique months: ${months.length}`);

    // Check for missing months in the range
    const allMonths = [];
    const firstDate = new Date(data[0].date_paid);
    const lastDate = new Date(data[data.length - 1].date_paid);
    
    let currentDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const endDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
    
    while (currentDate <= endDate) {
      allMonths.push(currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    console.log('\n📋 Expected months in range:');
    allMonths.forEach(month => console.log(`  - ${month}`));

    const missingMonths = allMonths.filter(month => !months.includes(month));
    
    if (missingMonths.length > 0) {
      console.log('\n❌ Missing months:');
      missingMonths.forEach(month => console.log(`  - ${month}`));
    } else {
      console.log('\n✅ All expected months are present in the database');
    }

    // Show monthly totals
    console.log('\n💰 Monthly totals:');
    const monthlyTotals = {};
    data.forEach(expense => {
      const monthKey = new Date(expense.date_paid).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (expense.amount_aed || 0);
    });

    Object.entries(monthlyTotals)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .forEach(([month, total]) => {
        console.log(`  ${month}: AED ${total.toLocaleString()}`);
      });

  } catch (error) {
    console.error('❌ Error in checkMonths:', error);
  }
}

checkMonths();

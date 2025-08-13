// Driver Management System Setup Script
// Run this script to initialize the driver management system

const { createClient } = require('@supabase/supabase-js');

// Configuration - Update these values
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDriverSystem() {
  console.log('🚗 Setting up Driver Management System...\n');

  try {
    // 1. Check if tables exist
    console.log('1. Checking database tables...');
    
    const { data: driversTable, error: driversError } = await supabase
      .from('drivers')
      .select('count')
      .limit(1);

    if (driversError) {
      console.log('❌ Drivers table does not exist. Please run the SQL script first.');
      console.log('   Run: create_drivers_table.sql in your Supabase SQL editor\n');
      return;
    }

    console.log('✅ Drivers table exists');

    // 2. Check storage buckets
    console.log('\n2. Checking storage buckets...');
    
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketNames = buckets.map(bucket => bucket.name);
      
      if (!bucketNames.includes('driver-images')) {
        console.log('⚠️  driver-images bucket not found. Please create it manually in Supabase dashboard.');
      } else {
        console.log('✅ driver-images bucket exists');
      }
      
      if (!bucketNames.includes('driver-documents')) {
        console.log('⚠️  driver-documents bucket not found. Please create it manually in Supabase dashboard.');
      } else {
        console.log('✅ driver-documents bucket exists');
      }
    } catch (error) {
      console.log('⚠️  Could not check storage buckets. Please verify manually.');
    }

    // 3. Check sample data
    console.log('\n3. Checking sample data...');
    
    const { data: drivers, error: countError } = await supabase
      .from('drivers')
      .select('id, full_name, employee_id')
      .limit(5);

    if (countError) {
      console.log('❌ Error checking sample data:', countError.message);
    } else if (drivers && drivers.length > 0) {
      console.log(`✅ Found ${drivers.length} driver(s) in database`);
      console.log('   Sample drivers:');
      drivers.forEach(driver => {
        console.log(`   - ${driver.full_name} (${driver.employee_id})`);
      });
    } else {
      console.log('⚠️  No drivers found. The table may be empty.');
    }

    // 4. Check RLS policies
    console.log('\n4. Checking Row Level Security...');
    
    try {
      const { data: policies } = await supabase
        .from('information_schema.policies')
        .select('policy_name, table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['drivers', 'driver_documents']);

      if (policies && policies.length > 0) {
        console.log('✅ RLS policies found:');
        policies.forEach(policy => {
          console.log(`   - ${policy.policy_name} on ${policy.table_name}`);
        });
      } else {
        console.log('⚠️  No RLS policies found. Please check your setup.');
      }
    } catch (error) {
      console.log('⚠️  Could not check RLS policies. Please verify manually.');
    }

    // 5. Test API endpoints
    console.log('\n5. Testing API endpoints...');
    
    try {
      // Test drivers list
      const { data: testDrivers, error: testError } = await supabase
        .from('drivers')
        .select('id, full_name')
        .limit(1);

      if (testError) {
        console.log('❌ API test failed:', testError.message);
      } else {
        console.log('✅ API endpoints working correctly');
      }
    } catch (error) {
      console.log('❌ API test failed:', error.message);
    }

    console.log('\n🎉 Driver Management System setup check completed!');
    console.log('\nNext steps:');
    console.log('1. Ensure storage buckets are created and configured');
    console.log('2. Verify RLS policies are working correctly');
    console.log('3. Test the frontend pages at /driver');
    console.log('4. Check file upload functionality');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your Supabase credentials');
    console.log('2. Ensure the database tables exist');
    console.log('3. Verify your network connection');
    console.log('4. Check Supabase dashboard for any errors');
  }
}

// Helper function to create storage buckets (if you have admin access)
async function createStorageBuckets() {
  console.log('\n🪣 Creating storage buckets...');
  
  try {
    // Note: This requires admin access to Supabase
    // In most cases, you'll need to create buckets manually in the dashboard
    
    console.log('⚠️  Storage bucket creation requires admin access.');
    console.log('   Please create the following buckets manually in Supabase dashboard:');
    console.log('   - driver-images');
    console.log('   - driver-documents');
    console.log('\n   Then set appropriate policies for authenticated users.');
    
  } catch (error) {
    console.log('❌ Could not create storage buckets:', error.message);
  }
}

// Helper function to insert sample data
async function insertSampleData() {
  console.log('\n📝 Inserting sample data...');
  
  try {
    const sampleDrivers = [
      {
        full_name: 'Ahmed Al Mansouri',
        employee_id: 'DRV001',
        designation: 'Senior Driver',
        nationality: 'UAE',
        company_mobile: '+971501234567',
        personal_mobile: '+971501234568',
        emirates_id_no: '784-1985-1234567-8',
        driving_license_no: 'UAE123456789',
        udrive_customer_account_id: 'UD12345',
        service_car_plate: 'ABC-123',
        team_type: 'Delivery',
        team_name: 'Team Alpha',
        team_members: 'Ahmed Al Mansouri, Fatima Al Zaabi, Omar Al Falasi',
        shift_type: 'Day',
        status: 'active'
      },
      {
        full_name: 'Fatima Al Zaabi',
        employee_id: 'DRV002',
        designation: 'Driver',
        nationality: 'UAE',
        company_mobile: '+971501234569',
        personal_mobile: '+971501234570',
        emirates_id_no: '784-1985-1234568-9',
        driving_license_no: 'UAE123456790',
        udrive_customer_account_id: 'UD12346',
        service_car_plate: 'XYZ-789',
        team_type: 'Transport',
        team_name: 'Team Beta',
        team_members: 'Fatima Al Zaabi, Khalid Al Suwaidi',
        shift_type: 'Night',
        status: 'active'
      }
    ];

    const { data, error } = await supabase
      .from('drivers')
      .insert(sampleDrivers)
      .select();

    if (error) {
      console.log('❌ Error inserting sample data:', error.message);
    } else {
      console.log(`✅ Inserted ${data.length} sample drivers`);
    }
    
  } catch (error) {
    console.log('❌ Could not insert sample data:', error.message);
  }
}

// Main execution
if (require.main === module) {
  // Check if credentials are provided
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.log('❌ Please set your Supabase credentials:');
    console.log('   Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    console.log('   Or update the values in this script\n');
    process.exit(1);
  }

  setupDriverSystem();
}

module.exports = {
  setupDriverSystem,
  createStorageBuckets,
  insertSampleData
};

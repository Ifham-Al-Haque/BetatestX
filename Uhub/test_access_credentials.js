// Test script to verify access credentials functionality
// Run this after implementing the database changes

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAccessCredentials() {
  console.log('🧪 Testing Access Credentials Functionality...\n');

  try {
    // Test 1: Check if new fields exist in drivers table
    console.log('1️⃣ Checking if new credential fields exist...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'drivers')
      .in('column_name', ['udrive_email', 'udrive_password', 'zimyo_email', 'zimyo_password']);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError.message);
      return;
    }

    if (columns && columns.length === 4) {
      console.log('✅ All credential fields found:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Missing credential fields. Expected 4, found:', columns?.length || 0);
      return;
    }

    // Test 2: Check existing driver data
    console.log('\n2️⃣ Checking existing driver data...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, full_name, employee_id, udrive_email, zimyo_email')
      .limit(3);

    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError.message);
      return;
    }

    if (drivers && drivers.length > 0) {
      console.log('✅ Found drivers:');
      drivers.forEach(driver => {
        console.log(`   - ${driver.full_name} (${driver.employee_id})`);
        console.log(`     Udrive: ${driver.udrive_email || 'Not set'}`);
        console.log(`     Zimyo: ${driver.zimyo_email || 'Not set'}`);
      });
    } else {
      console.log('❌ No drivers found');
    }

    // Test 3: Test inserting a new driver with credentials
    console.log('\n3️⃣ Testing driver creation with credentials...');
    const testDriver = {
      full_name: 'Test Driver Credentials',
      employee_id: 'TEST001',
      designation: 'Test Driver',
      nationality: 'Test',
      company_mobile: '+971501234567',
      emirates_id_no: 'TEST-1234-5678901-2',
      driving_license_no: 'TEST123456',
      shift_type: 'Day',
      status: 'active',
      udrive_email: 'test.driver@udrive.com',
      udrive_password: 'testpassword123',
      zimyo_email: 'test.driver@zimyo.com',
      zimyo_password: 'zimyopass456'
    };

    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert([testDriver])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating test driver:', insertError.message);
      return;
    }

    if (newDriver) {
      console.log('✅ Test driver created successfully:');
      console.log(`   - ID: ${newDriver.id}`);
      console.log(`   - Udrive: ${newDriver.udrive_email}`);
      console.log(`   - Zimyo: ${newDriver.zimyo_email}`);
      console.log(`   - Password fields present: ${!!newDriver.udrive_password && !!newDriver.zimyo_password}`);

      // Clean up: Delete test driver
      const { error: deleteError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', newDriver.id);

      if (deleteError) {
        console.log('⚠️  Warning: Could not delete test driver:', deleteError.message);
      } else {
        console.log('✅ Test driver cleaned up');
      }
    }

    // Test 4: Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, permissive')
      .eq('tablename', 'drivers');

    if (policiesError) {
      console.log('⚠️  Could not check RLS policies (may need admin access)');
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies found:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
      });
    } else {
      console.log('⚠️  No RLS policies found for drivers table');
    }

    console.log('\n🎉 Access Credentials Testing Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the frontend forms in your browser');
    console.log('2. Verify credentials are displayed correctly in driver profiles');
    console.log('3. Check that passwords are masked in the UI');
    console.log('4. Test creating and editing drivers with credentials');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAccessCredentials();
}

module.exports = { testAccessCredentials };

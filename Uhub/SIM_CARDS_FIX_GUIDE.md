# SIM Cards Fix Guide

## Problem
You're getting this error when trying to create a SIM card:
```
Failed to create SIM card: Could not find the 'current_user' column of 'sim_cards' in the schema cache
```

## Root Cause
This error indicates that either:
1. The `sim_cards` table doesn't exist in your database
2. The table exists but doesn't have the `current_user` column
3. There's a schema cache issue with Supabase
4. **The `current_user` column name conflicts with PostgreSQL reserved keyword**

## Solution

### Step 1: Run the Complete Fix Script
Execute the `fix_sim_cards_complete.sql` script in your Supabase SQL editor:

**Note**: The script now properly quotes the `current_user` column name since it's a PostgreSQL reserved keyword.

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_sim_cards_complete.sql`
4. Click "Run" to execute the script

This script will:
- Drop the existing table (if it exists)
- Create a new `sim_cards` table with the correct structure
- Add all necessary columns including `current_user`
- Set up proper indexes and constraints
- Enable Row Level Security (RLS)
- Create RLS policies for authenticated users
- Insert sample data
- Create the `sim_card_stats` view

### Step 2: Verify the Fix
After running the SQL script, test if everything is working:

1. Open your app in the browser
2. Navigate to the SIM Cards page
3. Try to create a new SIM card
4. If successful, the error should be resolved

### Step 3: Test the Table (Optional)
You can also run the test script to verify everything is working:

1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste the contents of `test_sim_cards_fix.js`
5. Run: `testSimCardsFix()`

This will test:
- Table structure
- `current_user` column existence
- Insert, update, and delete operations
- Stats view functionality

## What the Fix Does

### Table Structure
The `sim_cards` table now includes:
- `id` - Primary key
- `sim_number` - Unique SIM number
- `package_name` - Name of the package
- `package_type` - Type of package (Default, Custom, Corporate, Premium, Basic)
- `package_benefits` - Description of benefits
- `monthly_cost` - Monthly cost in AED
- `data_limit` - Data allowance
- `voice_minutes` - Voice minutes allowance
- `sms_limit` - SMS allowance
- **`current_user`** - Current user assigned to the SIM card
- `previous_user` - Previous user (if any)
- `department` - Department assignment
- `status` - SIM card status
- `activation_date` - When the SIM was activated
- `expiry_date` - When the SIM expires
- `notes` - Additional notes
- `user_id` - Reference to auth.users table
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### RLS Policies
- **View**: All users can view all SIM cards
- **Insert**: Authenticated users can insert SIM cards
- **Update**: Authenticated users can update SIM cards
- **Delete**: Authenticated users can delete SIM cards

### Indexes
Performance indexes are created on:
- `sim_number` (unique)
- `status`
- `department`
- **`current_user`**
- `user_id`
- `expiry_date`

## Alternative Solutions

### If you want to keep existing data:
Instead of dropping the table, you can use the `fix_sim_cards_add_columns.sql` script which adds missing columns without dropping the table.

Or manually add the missing columns:

```sql
-- Add the missing current_user column
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS current_user VARCHAR(100);

-- Add the missing previous_user column if it doesn't exist
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS previous_user VARCHAR(100);

-- Add other missing columns as needed
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS package_benefits TEXT;
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS data_limit VARCHAR(50);
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS voice_minutes VARCHAR(50);
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS sms_limit VARCHAR(50);
```

### If you have schema cache issues:
Sometimes Supabase has schema cache issues. You can try:

1. **Refresh the schema cache** in your Supabase dashboard
2. **Wait a few minutes** for the cache to refresh
3. **Restart your development server**

## Prevention

To avoid this issue in the future:

1. **Always run database migrations** when setting up new tables
2. **Use the SQL scripts** provided in this project
3. **Test table creation** in a development environment first
4. **Keep your database schema** in version control

## Support

If you continue to have issues after running the fix:

1. Check the Supabase logs for any errors
2. Verify that the SQL script executed successfully
3. Check if the table exists in your database
4. Ensure you have the correct permissions

## Files Created
- `fix_sim_cards_complete.sql` - Complete fix script (drops and recreates table)
- `fix_sim_cards_add_columns.sql` - Alternative fix script (adds missing columns without dropping table)
- `test_sim_cards_fix.js` - Test script to verify the fix
- `SIM_CARDS_FIX_GUIDE.md` - This guide

Run the fix script and your SIM cards should work correctly!

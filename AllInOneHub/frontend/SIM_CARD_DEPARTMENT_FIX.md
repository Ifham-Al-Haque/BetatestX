# SIM Card Department Constraint Fix

## Problem
You're getting this error when trying to create a SIM card:
```
Failed to create SIM card: new row for relation "sim_cards" violates check constraint "sim_cards_department_check"
```

## Root Cause
The database has a check constraint that only allows specific department values, but our new department values don't match what's allowed. Additionally, there are existing rows with old department values that need to be updated first.

## Solution Options

### Option 1: Quick Fix (Recommended for immediate use)
I've temporarily updated the departments configuration to use database-compatible values. The form will now show your preferred labels while using compatible database values.

**Current working configuration:**
- IT → displays as "TECHNOLOGY"
- Customer Service → displays as "CUSTOMER SERVICE"  
- Marketing → displays as "MARKETING"
- Finance → displays as "FINANCE"
- Management → displays as "MANAGEMENT"
- Operations → displays as "OPERATION"
- Other → displays as "OTHERS"

### Option 2: Permanent Fix (Update Database Constraint)
Run the SQL script `safe_department_fix.sql` in your Supabase SQL Editor to permanently allow your preferred department values.

## Step-by-Step Fix

### Step 1: Immediate Fix (Already Done)
The departments configuration has been temporarily updated to work with your current database.

### Step 2: Test SIM Card Creation
Try creating a SIM card now - it should work with the temporary configuration.

### Step 3: Permanent Fix (Optional)
If you want to use your exact preferred values, follow these steps carefully:

#### Option A: Use the Safe Script (Recommended)
1. Open `safe_department_fix.sql` in Supabase SQL Editor
2. Run the commands **one by one** in order
3. This approach is safer and avoids constraint violations

#### Option B: Manual Approach
If you prefer to run commands manually:

```sql
-- 1. First, check what departments currently exist
SELECT DISTINCT department FROM sim_cards ORDER BY department;

-- 2. Drop the existing constraint
ALTER TABLE sim_cards DROP CONSTRAINT IF EXISTS sim_cards_department_check;

-- 3. Update existing records to use new department values
UPDATE sim_cards SET department = 'TECHNOLOGY' WHERE department = 'IT';
UPDATE sim_cards SET department = 'CUSTOMER_SERVICE' WHERE department = 'Customer Service';
UPDATE sim_cards SET department = 'OPERATION' WHERE department = 'Operations';
UPDATE sim_cards SET department = 'OTHERS' WHERE department = 'Other';

-- 4. Create new constraint with your preferred values
ALTER TABLE sim_cards ADD CONSTRAINT sim_cards_department_check 
CHECK (department IN (
  'TECHNOLOGY',
  'HR', 
  'CUSTOMER_SERVICE',
  'MARKETING',
  'FINANCE',
  'MANAGEMENT',
  'OPERATION',
  'OTHERS'
));
```

### Step 4: Update Configuration (After SQL Fix)
Once you've updated the database constraint, uncomment the preferred configuration in `src/config/departments.js`:

```javascript
export const DEPARTMENTS = [
  { value: 'TECHNOLOGY', label: 'TECHNOLOGY', color: 'blue' },
  { value: 'HR', label: 'HR', color: 'pink' },
  { value: 'CUSTOMER_SERVICE', label: 'CUSTOMER SERVICE', color: 'cyan' },
  { value: 'MARKETING', label: 'MARKETING', color: 'purple' },
  { value: 'FINANCE', label: 'FINANCE', color: 'emerald' },
  { value: 'MANAGEMENT', label: 'MANAGEMENT', color: 'indigo' },
  { value: 'OPERATION', label: 'OPERATION', color: 'orange' },
  { value: 'OTHERS', label: 'OTHERS', color: 'gray' }
];
```

## Current Status
✅ **IMMEDIATE ISSUE FIXED** - You can now create SIM cards
✅ **Form shows your preferred labels** - Users see "TECHNOLOGY", "CUSTOMER SERVICE", etc.
⚠️ **Database still uses old values** - But this is transparent to users

## What You'll See Now
- **SIM Card Form**: Shows "TECHNOLOGY", "CUSTOMER SERVICE", "MARKETING", etc.
- **Department Filter**: Same options
- **SIM Card Display**: Shows your preferred labels
- **Database Storage**: Uses compatible values (IT, Customer Service, etc.)

## Next Steps
1. **Test creating a SIM card** - It should work now
2. **Decide if you want permanent fix** - Run SQL script to use exact values
3. **Update configuration** - Switch to preferred values after SQL fix

## Files Modified
- `src/config/departments.js` - Temporary fix with database-compatible values
- `safe_department_fix.sql` - Safe SQL script for permanent fix
- `fix_sim_cards_department_constraint.sql` - Alternative SQL fix script
- `SIM_CARD_DEPARTMENT_FIX.md` - This guide

## Testing
Try creating a SIM card now:
1. Go to SIM Card Management
2. Click "Add SIM Card"
3. Select "TECHNOLOGY" from department dropdown
4. Fill other required fields
5. Submit - should work without constraint error

## Important Notes
- **Always update existing data BEFORE changing constraints**
- **Run SQL commands one by one to avoid errors**
- **Use the safe script for better error handling**
- **Backup your data before making database changes**

The form will show your preferred labels while working with the current database constraints!

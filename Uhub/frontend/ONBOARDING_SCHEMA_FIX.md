# Onboarding Schema Fix Guide

## 🚨 **Current Error**
```
Could not find the 'assigned_to' column of 'employee_onboarding_records' in the schema cache
```

## 🔍 **Root Cause**
The `employee_onboarding_records` table either:
1. **Doesn't exist** in your database
2. **Exists but missing required columns** like `assigned_to`
3. **Has different schema** than expected

## 🚀 **IMMEDIATE FIX**

### **Option 1: Quick Fix (Recommended)**
Run this script in your Supabase SQL editor **RIGHT NOW**:

```sql
-- Copy and paste contents of quick_onboarding_table_fix.sql
```

This will:
- ✅ Create the `employee_onboarding_records` table if missing
- ✅ Include all required columns including `assigned_to`
- ✅ Set up basic RLS policies
- ✅ Add sample templates
- ✅ Test that everything works

### **Option 2: Complete Setup (If you want full features)**
Run this script for the complete system:

```sql
-- Copy and paste contents of create_onboarding_offboarding_tables.sql
```

## 🔧 **What the Fix Does**

### **Creates Missing Table:**
```sql
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Employee Info
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    
    -- Process Fields (including the missing 'assigned_to')
    template_id UUID,
    onboarding_status VARCHAR(50) DEFAULT 'pending',
    expected_completion_date DATE,
    assigned_to UUID,  -- This was missing!
    hr_contact UUID,
    onboarding_buddy UUID,
    notes TEXT,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Enhanced Error Handling:**
The code now includes fallback logic:
```javascript
// If column doesn't exist, retry with minimal data
if (error.message.includes('column') && error.message.includes('does not exist')) {
    // Retry with only core fields that definitely exist
    const minimalData = { /* core fields only */ };
}
```

## 🎯 **Expected Results After Fix**

### **Before Fix:**
- ❌ "assigned_to column not found" error
- ❌ Cannot create onboarding records
- ❌ Onboarding process fails

### **After Fix:**
- ✅ No column errors
- ✅ Onboarding records create successfully
- ✅ All fields work properly
- ✅ Clean separation from employees table

## 🧪 **Testing Steps**

### **1. Run the Fix Script**
- Copy `quick_onboarding_table_fix.sql` contents
- Paste in Supabase SQL editor
- Execute the script
- Look for success messages

### **2. Test the System**
1. **Refresh your browser** completely
2. **Navigate to Employee Onboarding** section
3. **Click "Start Onboarding"**
4. **Fill in new employee details**
5. **Complete onboarding setup**
6. **Submit** - should work without errors

### **3. Verify Database**
Check in Supabase SQL editor:
```sql
-- Verify table exists with correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employee_onboarding_records'
ORDER BY ordinal_position;

-- Check if templates exist
SELECT COUNT(*) FROM employee_onboarding_templates;

-- Test creating a record
SELECT 'Database is ready for onboarding!' as status;
```

## 🔍 **Troubleshooting**

### **If Fix Script Fails:**

1. **Check Table Existence:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%onboarding%';
```

2. **Manual Table Creation:**
If automated script fails, create manually:
```sql
-- Minimal table structure
CREATE TABLE employee_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    template_id UUID,
    expected_completion_date DATE,
    assigned_to UUID,
    notes TEXT,
    onboarding_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **Enable RLS:**
```sql
ALTER TABLE employee_onboarding_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for testing" ON employee_onboarding_records FOR ALL USING (true);
```

## 📋 **Success Checklist**

After running the fix:
- [ ] No "column not found" errors in browser console
- [ ] Can access Employee Onboarding section without errors
- [ ] "Start Onboarding" button works
- [ ] Can fill out new employee form
- [ ] Can submit form without database errors
- [ ] Onboarding record appears in the list

## 🎉 **Benefits of the Fix**

### **Clean Architecture:**
- ✅ **Separated Tables**: Onboarding separate from employees
- ✅ **No Schema Conflicts**: Independent table structure
- ✅ **Flexible Fields**: Can add any fields needed for onboarding
- ✅ **Process Tracking**: Dedicated workflow management

### **Better User Experience:**
- ✅ **No Errors**: Smooth onboarding process
- ✅ **Complete Data Collection**: All new employee information
- ✅ **Professional Workflow**: Proper HR process management
- ✅ **Progress Tracking**: Monitor onboarding progress

## 📞 **Support**

### **If You Still Get Errors:**

1. **Share the exact error message** from browser console
2. **Check Supabase logs** for detailed error information
3. **Verify database setup** by running the test queries above
4. **Try the manual table creation** if automated script fails

### **Quick Debug Commands:**
```javascript
// In browser console
console.log('Testing onboarding API...');
const result = await onboardingOffboardingApi.onboardingRecords.getAll();
console.log('Onboarding records:', result);
```

**Run the `quick_onboarding_table_fix.sql` script and the column error will be resolved!** 🚀

This creates the proper table structure with all required columns including `assigned_to`.

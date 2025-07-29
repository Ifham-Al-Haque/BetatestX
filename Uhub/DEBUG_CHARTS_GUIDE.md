# 🔍 Debug Charts & Tables Guide

## **Current Issue**
The Departmental Expenses chart and Detailed Expense Data table are not showing data in your Dashboard.

## **🔧 What I've Fixed**

**✅ Added Debugging:**
- Console logs to track data flow
- Temporary sample data for testing
- Data normalization for column name variations

**✅ Enhanced Error Handling:**
- Better error messages
- Graceful fallbacks
- Data validation

## **📊 How to Debug**

### **Step 1: Check Browser Console**

**Open Developer Tools (F12) and look for these messages:**

**✅ If Database is Working:**
```
🔍 Testing database access...
✅ Database access successful!
🔄 Starting to fetch real data...
✅ Expenses loaded: X records
📊 Sample expense data: [...]
✅ Expenses normalized and set
✅ Real data loading completed!
🔍 Filtering expenses: X total records
✅ Filtered expenses: X records after filtering
📊 Calculating chart data from X filtered expenses
📈 Department data: X departments
📈 Monthly data: X months
📈 Sample department data: [...]
```

**❌ If Database Has Issues:**
```
🔍 Testing database access...
❌ Payments table error: [error details]
❌ Database not accessible - adding temporary sample data for testing
✅ Temporary sample data added for testing
🔍 Filtering expenses: 6 total records
✅ Filtered expenses: 6 records after filtering
📊 Calculating chart data from 6 filtered expenses
📈 Department data: 3 departments
📈 Monthly data: 1 months
📈 Sample department data: [...]
```

### **Step 2: Check Your Database Structure**

**Run this in Supabase SQL editor:**
```sql
-- Check expenses table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
ORDER BY ordinal_position;

-- Check if you have data
SELECT COUNT(*) as total_records FROM expenses;
SELECT * FROM expenses LIMIT 3;
```

### **Step 3: Expected Column Names**

**Your expenses table should have these columns:**
- `id` (UUID or INTEGER)
- `title` (TEXT)
- `amount` or `amount_aed` (DECIMAL/NUMERIC)
- `date_paid` or `date` (DATE)
- `department` (TEXT)
- `category` (TEXT) - optional
- `vendor` (TEXT) - optional

### **Step 4: Common Issues & Fixes**

#### **Issue 1: Wrong Column Names**
**Problem:** Your database uses `amount` but code expects `amount_aed`

**Fix:** The code now normalizes this automatically, but you can also:
```sql
-- Rename column if needed
ALTER TABLE expenses RENAME COLUMN amount TO amount_aed;
```

#### **Issue 2: Missing Data**
**Problem:** No records in expenses table

**Fix:** Add some test data:
```sql
INSERT INTO expenses (title, amount_aed, date_paid, department, category, vendor) VALUES
('Office Supplies', 150.00, '2025-07-01', 'IT', 'Office Supplies', 'Office Depot'),
('Cloud Storage', 300.00, '2025-07-05', 'IT', 'Cloud Services', 'Google Cloud'),
('Software License', 500.00, '2025-07-10', 'IT', 'Software License', 'JetBrains');
```

#### **Issue 3: RLS Blocking Access**
**Problem:** Table exists but queries fail

**Fix:**
```sql
-- Add RLS policy for expenses
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');
```

#### **Issue 4: Wrong Data Types**
**Problem:** Date columns are TEXT instead of DATE

**Fix:**
```sql
-- Convert date column
ALTER TABLE expenses 
ALTER COLUMN date_paid TYPE DATE USING date_paid::DATE;
```

## **🎯 What You Should See**

### **✅ Working Charts:**
- **Departmental Expenses**: Pie chart showing IT, HR, Marketing
- **Detailed Expense Data**: Table with 6 sample records
- **Monthly Chart**: Bar chart showing July expenses
- **Yearly Breakdown**: Card showing 2025 total

### **✅ Working Tables:**
- **ScrollableExpenseTable**: Shows all expense records
- **Filters**: Department, Year, Date range filters work
- **Export**: CSV download works

## **🚨 If Still Not Working**

**Please provide:**
1. **Console output** (copy all the debug messages)
2. **Database structure** (output from Step 2 SQL)
3. **Any error messages** in red

**Quick Test:**
```sql
-- Test if you can access expenses table
SELECT * FROM expenses LIMIT 1;

-- If this fails, the issue is database access
-- If this works but shows no data, the issue is empty table
-- If this works and shows data, the issue is column names
```

## **🎉 Success Indicators**

**You'll know it's working when:**
- ✅ Console shows "✅ Real data loaded successfully!"
- ✅ Charts display data (not empty)
- ✅ Tables show records
- ✅ No red error messages
- ✅ Departmental chart shows IT, HR, Marketing slices

---

**🎯 Goal:** Get the console to show successful data loading and see charts/tables populated with your real data! 
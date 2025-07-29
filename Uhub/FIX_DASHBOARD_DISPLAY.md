# 🔧 Fix Dashboard Display Issues

## **Problem**
Your Dashboard has issues with:
- ❌ Detailed Expense Data table not showing data
- ❌ Departmental Expenses chart not displaying properly
- ❌ Some charts showing empty or incorrect data

## **🔍 Step 1: Check Your Database**

**Run this in your Supabase SQL editor:**
```sql
-- File: check_dashboard_data.sql
```

**This will show you:**
- ✅ Table structure and required columns
- ✅ Data quality issues
- ✅ Unique values for charts
- ✅ Sample data for verification

## **📊 Step 2: Expected Data Structure**

**Your expenses table should have these columns:**
```sql
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount_aed DECIMAL(10,2) NOT NULL,
    date_paid DATE NOT NULL,
    department TEXT,
    service_name TEXT,
    category TEXT,
    vendor TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## **🔧 Step 3: Fix Common Issues**

### **Issue 1: Missing Required Columns**
**Problem:** Charts show empty data

**Fix:**
```sql
-- Add missing columns
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS amount_aed DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS date_paid DATE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS service_name TEXT;
```

### **Issue 2: Wrong Column Names**
**Problem:** Data exists but not showing

**Fix:**
```sql
-- Rename columns if needed
ALTER TABLE expenses RENAME COLUMN amount TO amount_aed;
ALTER TABLE expenses RENAME COLUMN date TO date_paid;
ALTER TABLE expenses RENAME COLUMN dept TO department;
ALTER TABLE expenses RENAME COLUMN category TO service_name;
```

### **Issue 3: Missing Data**
**Problem:** Empty charts and tables

**Fix:**
```sql
-- Add sample data for testing
INSERT INTO expenses (title, amount_aed, date_paid, department, service_name) VALUES
('Office Supplies', 150.00, '2025-07-01', 'IT', 'Office Supplies'),
('Cloud Storage', 300.00, '2025-07-05', 'IT', 'Cloud Services'),
('Software License', 500.00, '2025-07-10', 'IT', 'Software License'),
('Internet Service', 200.00, '2025-07-15', 'IT', 'Internet'),
('Office Furniture', 800.00, '2025-07-20', 'HR', 'Furniture'),
('Marketing Materials', 400.00, '2025-07-25', 'Marketing', 'Marketing');
```

### **Issue 4: Data Quality Issues**
**Problem:** Zero amounts or missing departments

**Fix:**
```sql
-- Fix zero amounts
UPDATE expenses SET amount_aed = 100 WHERE amount_aed IS NULL OR amount_aed = 0;

-- Fix missing departments
UPDATE expenses SET department = 'IT' WHERE department IS NULL OR department = '';

-- Fix missing service names
UPDATE expenses SET service_name = 'General' WHERE service_name IS NULL OR service_name = '';

-- Fix missing dates
UPDATE expenses SET date_paid = '2025-01-01' WHERE date_paid IS NULL;
```

### **Issue 5: RLS Blocking Access**
**Problem:** 400 errors

**Fix:**
```sql
-- Add RLS policies
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');
```

## **📱 Step 4: Check Browser Console**

**Open Developer Tools (F12) and look for:**
```
🔍 Filtering expenses: X total records
🔍 Sample raw expenses: [...]
✅ Filtered expenses: X records after filtering
✅ Sample filtered expenses: [...]
📊 Calculating chart data from X filtered expenses
📊 Sample filtered expenses: [...]
📊 Processing expense 1: { amount, month, department, service }
📈 Department data: X departments
📈 Sample department data: [...]
```

## **🎯 Step 5: What Should Display**

### **✅ Departmental Expenses Chart:**
- **Type:** Pie Chart
- **Data:** Shows departments with amounts
- **Colors:** Different colors for each department
- **Labels:** Department name with percentage

### **✅ Detailed Expense Data Table:**
- **Type:** Scrollable table
- **Columns:** Date, Service, Department, Amount, Description
- **Features:** Search, sort, export to CSV
- **Data:** All expense records

### **✅ Expected Results:**
- **Departmental Chart:** Pie slices for IT, HR, Marketing, etc.
- **Detailed Table:** All your expense records with proper formatting
- **Filters:** Working department and year filters
- **Export:** CSV download functionality

## **🚨 Step 6: Debug Specific Issues**

### **If Departmental Chart is Empty:**
```sql
-- Check if you have department data
SELECT DISTINCT department, COUNT(*) FROM expenses GROUP BY department;
```

### **If Detailed Table is Empty:**
```sql
-- Check if you have any data
SELECT COUNT(*) FROM expenses;
SELECT * FROM expenses LIMIT 3;
```

### **If Charts Show "Unknown":**
```sql
-- Check date format
SELECT date_paid, COUNT(*) FROM expenses GROUP BY date_paid;
```

### **If Amounts are Zero:**
```sql
-- Check amount data
SELECT amount_aed, COUNT(*) FROM expenses GROUP BY amount_aed;
```

## **🔍 Step 7: Data Quality Checklist**

**Run these checks:**
```sql
-- Check data completeness
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN amount_aed > 0 THEN 1 END) as valid_amounts,
    COUNT(CASE WHEN date_paid IS NOT NULL THEN 1 END) as valid_dates,
    COUNT(CASE WHEN department IS NOT NULL AND department != '' THEN 1 END) as valid_departments,
    COUNT(CASE WHEN service_name IS NOT NULL AND service_name != '' THEN 1 END) as valid_services
FROM expenses;
```

## **🎉 Step 8: Success Indicators**

**You'll know it's working when:**
- ✅ Console shows "✅ Filtered expenses: X records"
- ✅ Departmental chart displays pie slices with departments
- ✅ Detailed table shows all your records
- ✅ No "Unknown" or empty values
- ✅ Filters work properly
- ✅ Export to CSV works

## **📞 Need Help?**

**Please provide:**
1. **Output from check_dashboard_data.sql**
2. **Browser console logs** (all debug messages)
3. **Your actual table structure**
4. **Sample of your real data**

**Quick Test:**
```sql
-- Test if your data can be processed
SELECT 
    title,
    amount_aed,
    date_paid,
    department,
    service_name
FROM expenses 
WHERE amount_aed > 0 
AND date_paid IS NOT NULL 
AND department IS NOT NULL
LIMIT 5;
```

---

**🎯 Goal:** Get your Detailed Expense Data table and Departmental Expenses chart displaying your real data correctly! 
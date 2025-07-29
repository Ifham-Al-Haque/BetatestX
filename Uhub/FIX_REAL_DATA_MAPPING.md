# 🔧 Fix Real Data Mapping Guide

## **Problem**
You have real data in Supabase but it's not showing properly in:
- ❌ Departmental Expenses chart
- ❌ Detailed Expense Data table
- ❌ Some other charts and data

## **🔍 Step 1: Check Your Data Structure**

**Run this in your Supabase SQL editor:**
```sql
-- File: check_your_real_data.sql
```

**This will show you:**
- ✅ Your actual table structure
- ✅ Sample data records
- ✅ Which columns have data
- ✅ Unique values in key columns
- ✅ Date ranges

## **📊 Step 2: Expected vs Actual Column Names**

**The Dashboard expects these column names:**
- `amount_aed` (or `amount`, `cost`, `value`)
- `date_paid` (or `date`, `payment_date`, `created_at`)
- `department` (or `dept`, `department_name`)
- `service_name` (or `service`, `category`, `type`)
- `vendor` (or `supplier`, `provider`)

**Common Issues:**
- Your database uses `amount` but code expects `amount_aed`
- Your database uses `date` but code expects `date_paid`
- Your database uses `dept` but code expects `department`
- Your database uses `category` but code expects `service_name`

## **🔧 Step 3: Fix Column Name Mismatches**

**If your columns have different names, run this:**
```sql
-- Rename columns to match expected names
ALTER TABLE expenses RENAME COLUMN amount TO amount_aed;
ALTER TABLE expenses RENAME COLUMN date TO date_paid;
ALTER TABLE expenses RENAME COLUMN dept TO department;
ALTER TABLE expenses RENAME COLUMN category TO service_name;
```

**Or add missing columns:**
```sql
-- Add missing columns if they don't exist
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS amount_aed DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS date_paid DATE,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS service_name TEXT;
```

## **📱 Step 4: Check Browser Console**

**Open Developer Tools (F12) and look for:**
```
🔍 Raw expense record: { your actual data }
✅ Normalized expense record: { normalized data }
📊 Calculating chart data from X filtered expenses
📊 Sample filtered expenses: [...]
📊 Processing expense 1: { amount, month, department, service }
📈 Department data: X departments
📈 Sample department data: [...]
```

## **🎯 Step 5: Common Data Issues**

### **Issue 1: Missing Department Data**
**Problem:** Departmental chart is empty

**Check:**
```sql
-- See what departments you have
SELECT DISTINCT department FROM expenses WHERE department IS NOT NULL;
```

**Fix:**
```sql
-- Update records with missing departments
UPDATE expenses SET department = 'IT' WHERE department IS NULL;
```

### **Issue 2: Invalid Dates**
**Problem:** Monthly chart shows "Unknown" month

**Check:**
```sql
-- See what dates you have
SELECT date_paid, COUNT(*) FROM expenses GROUP BY date_paid;
```

**Fix:**
```sql
-- Fix invalid dates
UPDATE expenses SET date_paid = '2025-01-01' WHERE date_paid IS NULL;
```

### **Issue 3: Zero Amounts**
**Problem:** Charts show no values

**Check:**
```sql
-- See what amounts you have
SELECT amount_aed, COUNT(*) FROM expenses GROUP BY amount_aed;
```

**Fix:**
```sql
-- Fix zero amounts
UPDATE expenses SET amount_aed = 100 WHERE amount_aed = 0 OR amount_aed IS NULL;
```

### **Issue 4: Wrong Data Types**
**Problem:** Amounts not calculating properly

**Check:**
```sql
-- Check data types
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'expenses' AND column_name LIKE '%amount%';
```

**Fix:**
```sql
-- Convert to proper type
ALTER TABLE expenses ALTER COLUMN amount_aed TYPE DECIMAL(10,2);
```

## **🔍 Step 6: Debug Your Data**

**Run these queries to see what's wrong:**

**Check if data exists:**
```sql
SELECT COUNT(*) as total_records FROM expenses;
SELECT COUNT(*) as records_with_amount FROM expenses WHERE amount_aed IS NOT NULL;
SELECT COUNT(*) as records_with_date FROM expenses WHERE date_paid IS NOT NULL;
SELECT COUNT(*) as records_with_dept FROM expenses WHERE department IS NOT NULL;
```

**Check unique values:**
```sql
SELECT department, COUNT(*) FROM expenses GROUP BY department;
SELECT service_name, COUNT(*) FROM expenses GROUP BY service_name;
```

**Check date ranges:**
```sql
SELECT MIN(date_paid), MAX(date_paid) FROM expenses WHERE date_paid IS NOT NULL;
```

## **🎯 Step 7: Expected Results**

**After fixing, you should see:**
- ✅ Console shows "✅ Normalized expense record:" with proper data
- ✅ Departmental chart shows your actual departments
- ✅ Monthly chart shows your actual months
- ✅ Detailed table shows your actual records
- ✅ All amounts calculate correctly

## **🚨 If Still Having Issues**

**Please provide:**
1. **Output from check_your_real_data.sql**
2. **Browser console logs** (all the debug messages)
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
LIMIT 5;
```

## **🎉 Success Indicators**

**You'll know it's working when:**
- ✅ Console shows normalized records with proper values
- ✅ Departmental chart displays your actual departments
- ✅ Monthly chart shows your actual monthly data
- ✅ Detailed table shows all your records
- ✅ No "Unknown" or empty values in charts

---

**🎯 Goal:** Get your real Supabase data displaying correctly in all charts and tables! 
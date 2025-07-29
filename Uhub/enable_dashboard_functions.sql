-- Enable Dashboard Functions Script
-- Run this AFTER you've set up the database tables

-- Check if all required tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') 
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'upcoming_payments')
        THEN '✅ All tables exist - Dashboard functions can be enabled'
        ELSE '❌ Missing tables - Run create_missing_tables.sql first'
    END as setup_status;

-- Check table record counts
SELECT 
    'payments' as table_name,
    COUNT(*) as record_count
FROM payments
UNION ALL
SELECT 
    'expenses' as table_name,
    COUNT(*) as record_count
FROM expenses
UNION ALL
SELECT 
    'upcoming_payments' as table_name,
    COUNT(*) as record_count
FROM upcoming_payments;

-- Instructions to enable dashboard functions:
/*
ONCE YOU SEE "✅ All tables exist" above, follow these steps:

1. Open frontend/src/pages/Dashboard.jsx
2. Find the commented sections (lines starting with //)
3. Uncomment these sections by removing the // at the beginning of each line:

   a) Find "// Fetch payments and calculate totals..." (around line 270)
   b) Find "// Auto Update Status - Temporarily disabled..." (around line 320)
   c) Find "// Update overdue payments status..." (around line 180)
   d) Find "// Fetch expenses on component mount..." (around line 310)

4. Save the file
5. The dashboard will now work with real data!

Example of what to uncomment:
   // useEffect(() => {
   //   const fetchPayments = async () => {
   //     ... code ...
   //   };
   //   fetchPayments();
   // }, []);

Should become:
   useEffect(() => {
     const fetchPayments = async () => {
       ... code ...
     };
     fetchPayments();
   }, []);
*/ 
-- =====================================================
-- VERIFY DASHBOARD DATA
-- Test the exact data your dashboard will display
-- =====================================================

-- Test the exact dashboard query
SELECT 'DASHBOARD QUERY TEST:' as info;
SELECT 
    id, 
    service_name, 
    amount_aed, 
    date_paid, 
    department, 
    service_status, 
    currency, 
    months, 
    created_at
FROM expenses 
ORDER BY date_paid ASC 
LIMIT 3;

-- Show total expenses
SELECT 'TOTAL EXPENSES:' as info;
SELECT SUM(amount_aed) as total_expenses FROM expenses;

-- Show current month expenses
SELECT 'CURRENT MONTH EXPENSES:' as info;
SELECT SUM(amount_aed) as current_month_total 
FROM expenses 
WHERE EXTRACT(MONTH FROM date_paid) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM date_paid) = EXTRACT(YEAR FROM CURRENT_DATE);

-- Show top services by amount
SELECT 'TOP SERVICES:' as info;
SELECT service_name, SUM(amount_aed) as total_amount
FROM expenses 
GROUP BY service_name 
ORDER BY total_amount DESC 
LIMIT 5;

-- Show by department
SELECT 'BY DEPARTMENT:' as info;
SELECT department, SUM(amount_aed) as total_amount
FROM expenses 
GROUP BY department 
ORDER BY total_amount DESC;

SELECT 'VERIFICATION COMPLETE!' as info; 
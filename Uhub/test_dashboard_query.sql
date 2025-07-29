-- =====================================================
-- TEST DASHBOARD QUERY
-- This is the exact query your dashboard will use
-- =====================================================

-- Test the exact dashboard query
SELECT 'TESTING DASHBOARD QUERY:' as info;
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
LIMIT 5;

-- Show total amount
SELECT 'TOTAL AMOUNT:' as info;
SELECT SUM(amount_aed) as total_amount FROM expenses;

-- Show by department
SELECT 'BY DEPARTMENT:' as info;
SELECT department, SUM(amount_aed) as total
FROM expenses 
GROUP BY department 
ORDER BY total DESC;

-- Show by service
SELECT 'BY SERVICE:' as info;
SELECT service_name, SUM(amount_aed) as total
FROM expenses 
GROUP BY service_name 
ORDER BY total DESC; 
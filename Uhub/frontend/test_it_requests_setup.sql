-- Test and Fix IT Requests Database Structure
-- Run this script to verify and fix the IT requests system

-- First, let's check if the tables exist and their structure
SELECT 
    'Checking table structure...' as status;

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('it_requests', 'it_request_categories', 'it_request_priorities') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_name IN ('it_requests', 'it_request_categories', 'it_request_priorities');

-- Check table columns
SELECT 
    'it_request_categories columns:' as table_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'it_request_categories'
ORDER BY ordinal_position;

SELECT 
    'it_request_priorities columns:' as table_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'it_request_priorities'
ORDER BY ordinal_position;

SELECT 
    'it_requests columns:' as table_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'it_requests'
ORDER BY ordinal_position;

-- Check if data exists in the tables
SELECT 
    'Checking data in tables...' as status;

SELECT 
    'it_request_categories count:' as table_name,
    COUNT(*) as record_count
FROM it_request_categories;

SELECT 
    'it_request_priorities count:' as table_name,
    COUNT(*) as record_count
FROM it_request_priorities;

SELECT 
    'it_requests count:' as table_name,
    COUNT(*) as record_count
FROM it_requests;

-- Test a simple query to see if the join works
SELECT 
    'Testing basic query...' as status;

SELECT 
    r.id,
    r.title,
    r.status,
    c.name as category_name,
    p.name as priority_name,
    p.sla_hours
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LIMIT 5;

-- If the above query fails, let's check the foreign key relationships
SELECT 
    'Checking foreign key constraints...' as status;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('it_requests', 'it_request_categories', 'it_request_priorities');

-- Check RLS policies
SELECT 
    'Checking RLS policies...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('it_requests', 'it_request_categories', 'it_request_priorities');

-- If there are issues, let's try to fix them
DO $$
BEGIN
    -- Check if the priority table has the correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'it_request_priorities' 
        AND column_name = 'sla_hours'
    ) THEN
        RAISE NOTICE 'Adding sla_hours column to it_request_priorities table';
        ALTER TABLE it_request_priorities ADD COLUMN sla_hours INTEGER DEFAULT 72;
        
        -- Update existing records with default SLA hours
        UPDATE it_request_priorities SET sla_hours = 2 WHERE name = 'Critical';
        UPDATE it_request_priorities SET sla_hours = 4 WHERE name = 'High';
        UPDATE it_request_priorities SET sla_hours = 24 WHERE name = 'Medium';
        UPDATE it_request_priorities SET sla_hours = 72 WHERE name = 'Low';
        UPDATE it_request_priorities SET sla_hours = 168 WHERE name = 'Info';
        
        RAISE NOTICE 'Updated SLA hours for existing priority levels';
    ELSE
        RAISE NOTICE 'sla_hours column already exists in it_request_priorities table';
    END IF;
    
    -- Check if the categories table has the correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'it_request_categories' 
        AND column_name = 'color'
    ) THEN
        RAISE NOTICE 'Adding color column to it_request_categories table';
        ALTER TABLE it_request_categories ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
        ALTER TABLE it_request_categories ADD COLUMN icon VARCHAR(50) DEFAULT 'settings';
        ALTER TABLE it_request_categories ADD COLUMN sort_order INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added color, icon, and sort_order columns to it_request_categories table';
    ELSE
        RAISE NOTICE 'color, icon, and sort_order columns already exist in it_request_categories table';
    END IF;
    
    -- Check if the requests table has the correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'it_requests' 
        AND column_name = 'resolution_notes'
    ) THEN
        RAISE NOTICE 'Adding missing columns to it_requests table';
        ALTER TABLE it_requests ADD COLUMN resolution_notes TEXT;
        ALTER TABLE it_requests ADD COLUMN closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE it_requests ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added missing columns to it_requests table';
    ELSE
        RAISE NOTICE 'All required columns already exist in it_requests table';
    END IF;
    
END $$;

-- Final verification
SELECT 
    'Final verification...' as status;

-- Test the query again
SELECT 
    r.id,
    r.title,
    r.status,
    c.name as category_name,
    p.name as priority_name,
    p.sla_hours,
    r.created_at
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- Show summary
SELECT 
    'IT Requests System Status:' as summary,
    (SELECT COUNT(*) FROM it_request_categories) as categories_count,
    (SELECT COUNT(*) FROM it_request_priorities) as priorities_count,
    (SELECT COUNT(*) FROM it_requests) as requests_count,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'it_request_priorities' 
            AND column_name = 'sla_hours'
        ) THEN 'SLA hours column: OK'
        ELSE 'SLA hours column: MISSING'
    END as sla_status;

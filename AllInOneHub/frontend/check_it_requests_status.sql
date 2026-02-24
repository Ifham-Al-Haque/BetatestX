-- Check IT Requests Status
-- This script checks what tables, policies, and functions already exist

-- Check if tables exist
SELECT 
  'Tables' as object_type,
  tablename as object_name,
  'EXISTS' as status
FROM pg_tables 
WHERE tablename IN ('it_request_categories', 'it_request_priorities', 'it_requests')
UNION ALL
SELECT 
  'Tables' as object_type,
  'it_request_categories' as object_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'it_request_categories') 
       THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'Tables' as object_type,
  'it_request_priorities' as object_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'it_request_priorities') 
       THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'Tables' as object_type,
  'it_requests' as object_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'it_requests') 
       THEN 'EXISTS' ELSE 'MISSING' END as status

UNION ALL

-- Check if views exist
SELECT 
  'Views' as object_type,
  viewname as object_name,
  'EXISTS' as status
FROM pg_views 
WHERE viewname = 'it_request_details'
UNION ALL
SELECT 
  'Views' as object_type,
  'it_request_details' as object_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'it_request_details') 
       THEN 'EXISTS' ELSE 'MISSING' END as status

UNION ALL

-- Check if functions exist
SELECT 
  'Functions' as object_type,
  proname as object_name,
  'EXISTS' as status
FROM pg_proc 
WHERE proname = 'generate_request_number'
UNION ALL
SELECT 
  'Functions' as object_type,
  'get_it_request_stats' as object_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_it_request_stats') 
       THEN 'EXISTS' ELSE 'MISSING' END as status

UNION ALL

-- Check if policies exist
SELECT 
  'Policies' as object_type,
  policyname as object_name,
  'EXISTS' as status
FROM pg_policies 
WHERE tablename IN ('it_request_categories', 'it_request_priorities', 'it_requests')
  AND policyname LIKE '%Allow authenticated users%'

ORDER BY object_type, object_name;

-- Test if IT Request tables exist and have data
-- Run this in Supabase SQL Editor to verify setup

-- Check if tables exist
SELECT 
  'it_request_categories' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'it_request_categories') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  (SELECT COUNT(*) FROM it_request_categories) as record_count
UNION ALL
SELECT 
  'it_request_priorities' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'it_request_priorities') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  (SELECT COUNT(*) FROM it_request_priorities) as record_count
UNION ALL
SELECT 
  'it_requests' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'it_requests') 
       THEN 'EXISTS' ELSE 'MISSING' END as status,
  (SELECT COUNT(*) FROM it_requests) as record_count;

-- Check if view exists
SELECT 
  'it_request_details' as object_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'it_request_details') 
       THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Test basic query on it_requests table
SELECT 
  'Basic query test' as test_name,
  CASE WHEN EXISTS (SELECT 1 FROM it_requests LIMIT 1) 
       THEN 'SUCCESS' ELSE 'NO DATA' END as status;

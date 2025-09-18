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

-- Verify user humera@udrive.ae in Supabase
-- Check in auth.users table (Supabase authentication)
SELECT 
  'User verification - auth.users' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'humera@udrive.ae') 
    THEN 'USER EXISTS' 
    ELSE 'USER NOT FOUND' 
  END as status,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'humera@udrive.ae') as user_count;

-- Get detailed user information if exists
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'humera@udrive.ae';

-- Check if user exists in any custom users table (if you have one)
SELECT 
  'User verification - custom users table' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN 
      CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'humera@udrive.ae') 
        THEN 'USER EXISTS IN CUSTOM TABLE' 
        ELSE 'USER NOT FOUND IN CUSTOM TABLE' 
      END
    ELSE 'CUSTOM USERS TABLE DOES NOT EXIST' 
  END as status;
-- Diagnostic script to check database state
-- Run this in Supabase SQL Editor to see what's happening

-- Check if the employees table exists (required for foreign key)
SELECT 'employees table exists' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') 
            THEN 'YES' 
            ELSE 'NO' 
       END as result;

-- Check if the users table exists (required for RLS policies)
SELECT 'users table exists' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
            THEN 'YES' 
            ELSE 'NO' 
       END as result;

-- Check if employee_offboarding_records table exists
SELECT 'employee_offboarding_records table exists' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_offboarding_records') 
            THEN 'YES' 
            ELSE 'NO' 
       END as result;

-- List all tables that start with 'employee_'
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name LIKE 'employee_%' 
ORDER BY table_name;

-- Check current user and role
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- Check if there are any existing policies on employee_offboarding_records
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'employee_offboarding_records';
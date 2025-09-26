-- Test script to verify role access for Employee Onboarding and Offboarding
-- Run this in Supabase SQL Editor

-- Step 1: Check if the tables exist
SELECT 
    'Table existence check:' as info,
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) 
         THEN 'EXISTS' 
         ELSE 'MISSING' 
    END as status
FROM (VALUES 
    ('employee_onboarding_templates'),
    ('employee_onboarding_records'),
    ('employee_onboarding_checklist'),
    ('employee_offboarding_records'),
    ('employee_offboarding_checklist')
) AS tables(table_name);

-- Step 2: Check RLS policies for onboarding tables
SELECT 
    'RLS Policies for onboarding tables:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('employee_onboarding_templates', 'employee_onboarding_records', 'employee_onboarding_checklist')
ORDER BY tablename, policyname;

-- Step 3: Check RLS policies for offboarding tables
SELECT 
    'RLS Policies for offboarding tables:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('employee_offboarding_records', 'employee_offboarding_checklist')
ORDER BY tablename, policyname;

-- Step 4: Test data access for different roles (if tables exist)
-- This will show if the RLS policies are working correctly

-- Check if we can select from onboarding templates (should work for admin, hr_manager, it_management)
SELECT 
    'Testing SELECT access to onboarding templates:' as info,
    COUNT(*) as record_count
FROM employee_onboarding_templates;

-- Check if we can select from offboarding records (should work for admin, hr_manager, it_management)
SELECT 
    'Testing SELECT access to offboarding records:' as info,
    COUNT(*) as record_count
FROM employee_offboarding_records;

-- Step 5: Check current authenticated user context
SELECT 
    'Current authentication context:' as info,
    auth.uid() as user_id,
    auth.email() as email,
    auth.role() as auth_role;

-- Step 6: Verify user role in users table
SELECT 
    'Current user role in users table:' as info,
    u.email,
    u.role,
    u.status
FROM users u
WHERE u.auth_user_id = auth.uid();

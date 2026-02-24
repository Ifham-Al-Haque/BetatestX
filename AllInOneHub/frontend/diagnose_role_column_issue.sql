-- Diagnostic Script for Role Column Issue
-- Run this to understand what happened and verify the fix

-- 1. Check if employees table has role column
SELECT 
    'Employees Table Role Column' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'role'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check if users table has role column
SELECT 
    'Users Table Role Column' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 3. Show all columns in employees table
SELECT 
    'Employees Table Columns' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 4. Show all columns in users table
SELECT 
    'Users Table Columns' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Check for any foreign key relationships
SELECT 
    'Foreign Key Relationships' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'employees' OR tc.table_name = 'users')
ORDER BY tc.table_name, kcu.column_name;

-- 6. Check current user and authentication status
SELECT 
    'Current Authentication Status' as check_name,
    auth.uid() as current_user_id,
    auth.role() as current_role;

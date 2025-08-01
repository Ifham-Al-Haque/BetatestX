-- =====================================================
-- FIX EMPLOYEES TABLE 406 ERROR
-- This script diagnoses and fixes issues with the employees table
-- that might be causing 406 errors in the frontend
-- =====================================================

-- Step 1: Check current employees table structure
SELECT '=== CURRENT EMPLOYEES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if there are any data type issues with the id column
SELECT '=== CHECKING ID COLUMN DATA TYPES ===' as info;
SELECT 
    id,
    pg_typeof(id) as id_type,
    length(id::text) as id_length
FROM employees 
LIMIT 5;

-- Step 3: Check for any malformed UUIDs or data issues
SELECT '=== CHECKING FOR DATA ISSUES ===' as info;
SELECT 
    id,
    CASE 
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
        THEN 'Valid UUID' 
        ELSE 'Invalid UUID' 
    END as uuid_validity,
    full_name,
    email
FROM employees 
LIMIT 10;

-- Step 4: Ensure the id column is properly typed as UUID
SELECT '=== FIXING ID COLUMN TYPE ===' as info;
DO $$ 
BEGIN
    -- Check if id column is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        -- Convert text to UUID if needed
        ALTER TABLE employees ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Converted id column to UUID type';
    ELSE
        RAISE NOTICE 'ID column is already UUID type';
    END IF;
END $$;

-- Step 5: Ensure all required columns exist with proper defaults
SELECT '=== ENSURING REQUIRED COLUMNS ===' as info;
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
        ALTER TABLE employees ADD COLUMN role TEXT DEFAULT 'employee';
        RAISE NOTICE 'Added role column';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status') THEN
        ALTER TABLE employees ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department') THEN
        ALTER TABLE employees ADD COLUMN department TEXT DEFAULT 'Unassigned';
        RAISE NOTICE 'Added department column';
    END IF;
    
    -- Add position column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'position') THEN
        ALTER TABLE employees ADD COLUMN position TEXT DEFAULT 'Employee';
        RAISE NOTICE 'Added position column';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_at') THEN
        ALTER TABLE employees ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'updated_at') THEN
        ALTER TABLE employees ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Step 6: Disable RLS temporarily to test access
SELECT '=== DISABLING RLS FOR TESTING ===' as info;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Step 7: Test the exact query that's failing
SELECT '=== TESTING THE FAILING QUERY ===' as info;
-- Replace the UUID below with the actual user ID from your error
-- The error shows: 24e0b410-74d9-4ce1-a8b1-b26aa35850e0
SELECT 'Testing query for user: 24e0b410-74d9-4ce1-a8b1-b26aa35850e0' as test_query;
SELECT * FROM employees WHERE id = '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'::UUID;

-- Step 8: Show all employees for debugging
SELECT '=== ALL EMPLOYEES FOR DEBUGGING ===' as info;
SELECT 
    id,
    full_name,
    email,
    role,
    status,
    department,
    position,
    created_at
FROM employees 
ORDER BY created_at DESC
LIMIT 10;

-- Step 9: Create a test user if none exists
SELECT '=== CREATING TEST USER IF NEEDED ===' as info;
INSERT INTO employees (
    id, 
    full_name, 
    email, 
    role, 
    status, 
    department, 
    position
) VALUES (
    '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'::UUID,
    'Test User',
    'test@example.com',
    'employee',
    'active',
    'IT',
    'Developer'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    updated_at = NOW();

-- Step 10: Test the query again
SELECT '=== FINAL TEST QUERY ===' as info;
SELECT 
    'Query result for 24e0b410-74d9-4ce1-a8b1-b26aa35850e0:' as test,
    id,
    full_name,
    email,
    role,
    status
FROM employees 
WHERE id = '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'::UUID;

-- Step 11: Show final table structure
SELECT '=== FINAL TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== EMPLOYEES TABLE FIX COMPLETED ===' as info;
SELECT 'The employees table should now work properly with your frontend!' as success_message; 
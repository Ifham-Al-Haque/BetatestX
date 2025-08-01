-- =====================================================
-- FINAL EMPLOYEES TABLE FIX
-- This script ensures the employees table is properly configured
-- =====================================================

-- Step 1: Check current table structure
SELECT '=== CURRENT EMPLOYEES TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Ensure id column is UUID type
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' 
        AND column_name = 'id' 
        AND data_type != 'uuid'
    ) THEN
        ALTER TABLE employees ALTER COLUMN id TYPE UUID USING id::UUID;
        RAISE NOTICE 'Converted id column to UUID type';
    ELSE
        RAISE NOTICE 'ID column is already UUID type';
    END IF;
END $$;

-- Step 3: Add missing columns if they don't exist
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

-- Step 4: Enable RLS and create proper policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON employees;
DROP POLICY IF EXISTS "Enable update for users based on id" ON employees;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON employees;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON employees
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on id" ON employees
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id" ON employees
    FOR DELETE USING (auth.uid() = id);

-- Step 5: Test the connection
SELECT '=== TESTING CONNECTION ===' as info;
SELECT 
    'Connection test successful' as status,
    COUNT(*) as employee_count
FROM employees;

-- Step 6: Show final table structure
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
SELECT 'Your employees table is now properly configured!' as success_message; 
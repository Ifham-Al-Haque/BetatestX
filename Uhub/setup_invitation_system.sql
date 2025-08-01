-- =====================================================
-- SETUP INVITATION SYSTEM
-- Creates necessary tables for invitation-based access
-- =====================================================

-- Step 1: Create access_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    department TEXT DEFAULT 'Unassigned',
    status TEXT NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_invited_at ON access_requests(invited_at);

-- Step 3: Create RLS policies for access_requests
ALTER TABLE access_requests DISABLE ROW LEVEL SECURITY;

-- Step 4: Update employees table if needed
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
        ALTER TABLE employees ADD COLUMN role TEXT DEFAULT 'employee';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'status') THEN
        ALTER TABLE employees ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department') THEN
        ALTER TABLE employees ADD COLUMN department TEXT DEFAULT 'Unassigned';
    END IF;
END $$;

-- Step 5: Disable RLS on employees table for now
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Step 6: Create admin user if not exists
INSERT INTO employees (id, full_name, email, role, status, department, position)
VALUES (
    'admin-user-id', -- Replace with actual admin user ID
    'System Administrator',
    'admin@udrive.ae',
    'admin',
    'active',
    'IT',
    'System Administrator'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    department = 'IT';

-- Step 7: Show table structures
SELECT '=== ACCESS_REQUESTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'access_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== EMPLOYEES TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 8: Test data insertion
SELECT '=== TESTING ACCESS REQUESTS ===' as info;
INSERT INTO access_requests (email, role, department, status)
VALUES 
    ('test@example.com', 'employee', 'IT', 'pending'),
    ('manager@example.com', 'manager', 'HR', 'pending')
ON CONFLICT (email) DO NOTHING;

-- Step 9: Show sample data
SELECT '=== SAMPLE ACCESS REQUESTS ===' as info;
SELECT email, role, department, status, invited_at
FROM access_requests
ORDER BY invited_at DESC
LIMIT 5;

SELECT '=== INVITATION SYSTEM SETUP COMPLETE ===' as info;
SELECT 'Your invitation system is now ready!' as success_message; 
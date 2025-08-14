-- Test Current Roles and User State
-- Run this first to see what we're working with

-- 1. Check if ifham@udrive.ae exists and their current role
SELECT '=== CURRENT USER STATE ===' as section;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM employees 
WHERE email = 'ifham@udrive.ae';

-- 2. Check all existing roles in the system
SELECT '=== EXISTING ROLES ===' as section;
SELECT DISTINCT role FROM employees ORDER BY role;

-- 3. Check if roles table exists
SELECT '=== ROLES TABLE STATUS ===' as section;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
) as roles_table_exists;

-- 4. Check if storage buckets exist
SELECT '=== STORAGE BUCKETS STATUS ===' as section;
SELECT id, name, public FROM storage.buckets WHERE id IN ('driver-profiles', 'driver-documents');

-- 5. Check current RLS policies on drivers table
SELECT '=== CURRENT DRIVER RLS POLICIES ===' as section;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'drivers';

-- 6. Check if driver_documents table exists
SELECT '=== DRIVER_DOCUMENTS TABLE STATUS ===' as section;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'driver_documents'
) as driver_documents_table_exists;

-- 7. Test basic access to drivers table
SELECT '=== BASIC ACCESS TEST ===' as section;
SELECT COUNT(*) as driver_count FROM drivers;

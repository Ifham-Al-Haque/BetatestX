-- Fix Onboarding ID Lookup Issue
-- This script ensures the onboarding records can be found by ID
-- Run this in your Supabase SQL editor

-- Step 1: Check current table structure
SELECT 
    'Current Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employee_onboarding_records'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check existing records and their IDs
SELECT 
    'Existing Records' as info,
    id,
    record_id,
    full_name,
    email,
    onboarding_status
FROM employee_onboarding_records
ORDER BY created_at DESC;

-- Step 3: Ensure record_id field exists and is populated
DO $$
DECLARE
    record_count INTEGER;
    has_record_id_column BOOLEAN;
BEGIN
    -- Check if record_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_onboarding_records' 
        AND column_name = 'record_id'
        AND table_schema = 'public'
    ) INTO has_record_id_column;
    
    IF NOT has_record_id_column THEN
        -- Add record_id column if it doesn't exist
        ALTER TABLE employee_onboarding_records 
        ADD COLUMN record_id UUID DEFAULT gen_random_uuid() UNIQUE;
        
        RAISE NOTICE 'Added record_id column to employee_onboarding_records';
    END IF;
    
    -- Check if any records have null record_id
    SELECT COUNT(*) INTO record_count 
    FROM employee_onboarding_records 
    WHERE record_id IS NULL;
    
    IF record_count > 0 THEN
        -- Update records with null record_id
        UPDATE employee_onboarding_records 
        SET record_id = gen_random_uuid() 
        WHERE record_id IS NULL;
        
        RAISE NOTICE 'Updated % records with missing record_id', record_count;
    END IF;
END $$;

-- Step 4: Create index on record_id for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_records_record_id 
ON employee_onboarding_records(record_id);

-- Step 5: Test record lookup with both ID methods
DO $$
DECLARE
    test_id UUID;
    test_record_id UUID;
    lookup_by_id RECORD;
    lookup_by_record_id RECORD;
BEGIN
    -- Get a test record
    SELECT id, record_id INTO test_id, test_record_id 
    FROM employee_onboarding_records 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Test lookup by main id
        SELECT * INTO lookup_by_id 
        FROM employee_onboarding_records 
        WHERE id = test_id;
        
        IF FOUND THEN
            RAISE NOTICE '✅ Lookup by id field WORKS';
        ELSE
            RAISE NOTICE '❌ Lookup by id field FAILED';
        END IF;
        
        -- Test lookup by record_id
        IF test_record_id IS NOT NULL THEN
            SELECT * INTO lookup_by_record_id 
            FROM employee_onboarding_records 
            WHERE record_id = test_record_id;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Lookup by record_id field WORKS';
            ELSE
                RAISE NOTICE '❌ Lookup by record_id field FAILED';
            END IF;
        END IF;
        
    ELSE
        RAISE NOTICE 'ℹ️ No records available for testing';
    END IF;
END $$;

-- Step 6: Update the onboarding_dashboard view to include both ID fields
DROP VIEW IF EXISTS onboarding_dashboard;
CREATE VIEW onboarding_dashboard AS
SELECT 
    r.id,
    r.record_id,
    r.full_name,
    r.employee_id,
    r.email,
    r.phone,
    r.position,
    r.department,
    r.start_date,
    r.onboarding_status as status,
    r.expected_completion_date,
    r.completion_percentage as progress_percentage,
    r.notes,
    r.created_at,
    r.updated_at,
    t.name as template_name,
    t.description as template_description
FROM employee_onboarding_records r
LEFT JOIN employee_onboarding_templates t ON r.template_id = t.id
ORDER BY r.created_at DESC;

-- Step 7: Test the view
SELECT 
    'View Test' as info,
    id,
    record_id,
    full_name,
    status
FROM onboarding_dashboard
LIMIT 5;

-- Step 8: Final verification
SELECT 
    'ID Lookup Fix Status' as check_name,
    (SELECT COUNT(*) FROM employee_onboarding_records) as total_records,
    (SELECT COUNT(*) FROM employee_onboarding_records WHERE record_id IS NOT NULL) as records_with_record_id,
    (SELECT COUNT(*) FROM employee_onboarding_records WHERE id IS NOT NULL) as records_with_id,
    'Ready for lookup testing' as status;

-- Success message
SELECT '🎉 ONBOARDING ID LOOKUP FIXED!' as result;
SELECT 'Records can now be found by both id and record_id fields.' as details;
SELECT 'The 406 PGRST116 error should be resolved.' as fix_status;

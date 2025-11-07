-- Check the actual foreign key constraints on tasks table
-- This will show what the assigned_to and assigned_by columns actually reference

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tasks'
    AND (kcu.column_name = 'assigned_to' OR kcu.column_name = 'assigned_by');

-- Check if tasks.assigned_to references auth.users or users table
SELECT 
  'Foreign Key Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'tasks' 
        AND kcu.column_name = 'assigned_to'
        AND ccu.table_name = 'auth.users'
    ) THEN '✅ tasks.assigned_to references auth.users(id)'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'tasks' 
        AND kcu.column_name = 'assigned_to'
        AND ccu.table_name = 'users'
    ) THEN '✅ tasks.assigned_to references users(id)'
    ELSE '❌ No foreign key constraint found'
  END as constraint_status;


-- Fix Audit Log RLS Policy Issues
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current RLS status and policies
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'audit_log';

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'audit_log';

-- 2. Temporarily disable RLS on audit_log to allow operations
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- 3. Drop any existing problematic policies
DROP POLICY IF EXISTS "audit_log_select_policy" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert_policy" ON audit_log;
DROP POLICY IF EXISTS "audit_log_update_policy" ON audit_log;
DROP POLICY IF EXISTS "audit_log_delete_policy" ON audit_log;

-- 4. Re-enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 5. Create permissive policies for audit_log (since it's a system table)
CREATE POLICY "audit_log_select_policy" ON audit_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "audit_log_insert_policy" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "audit_log_update_policy" ON audit_log
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "audit_log_delete_policy" ON audit_log
  FOR DELETE TO authenticated USING (true);

-- 6. Also check if there are any triggers that might be causing issues
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'audit_log';

-- 7. If there are problematic triggers, we can temporarily disable them
-- (Uncomment the lines below if needed)
-- SELECT 'ALTER TABLE audit_log DISABLE TRIGGER ' || trigger_name || ';' as disable_command
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'audit_log';

-- 8. Grant necessary permissions to the authenticated role
GRANT ALL ON audit_log TO authenticated;

-- 9. Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'audit_log';

-- 10. Test if the table is accessible
SELECT COUNT(*) FROM audit_log LIMIT 1;

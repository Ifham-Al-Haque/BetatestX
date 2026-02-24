-- Quick Fix for Audit Log RLS Issue
-- This will resolve the "new row violates row-level security policy for table audit_log" error

-- Option 1: Quick Fix - Disable RLS on audit_log (Recommended for system tables)
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Option 2: Alternative - Create permissive policy (if you prefer to keep RLS enabled)
-- ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "audit_log_all_policy" ON audit_log;
-- CREATE POLICY "audit_log_all_policy" ON audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON audit_log TO authenticated;

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'audit_log';

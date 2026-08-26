-- Restrict payroll tables so salary data is not readable by every logged-in UHub user.
-- Run this in the UHub Supabase SQL editor (project qtugowosurgecytgswuo).
-- Safe to re-run.
--
-- What this does:
--   Any authenticated user used to be able to SELECT/INSERT/UPDATE payrolls
--   (policies used USING (true)). The UI hid the page, but the Data API did not.
--   After this script, only UHub users with role admin, hr_manager, or super_admin
--   can access payroll tables. Deletes of payroll records are admin/super_admin only.
--
-- What this does NOT do:
--   Supabase dashboard / postgres superuser can still see plaintext amounts.
--   That is expected — column encryption is a separate, much heavier project.

CREATE OR REPLACE FUNCTION public.is_payroll_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'hr_manager', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_payroll_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_payroll_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_payroll_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_payroll_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_payroll_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- payrolls
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payrolls FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payrolls_auth_all ON public.payrolls;
DROP POLICY IF EXISTS payrolls_staff_select ON public.payrolls;
DROP POLICY IF EXISTS payrolls_staff_insert ON public.payrolls;
DROP POLICY IF EXISTS payrolls_staff_update ON public.payrolls;
DROP POLICY IF EXISTS payrolls_admin_delete ON public.payrolls;

CREATE POLICY payrolls_staff_select
  ON public.payrolls
  FOR SELECT
  TO authenticated
  USING (public.is_payroll_staff());

CREATE POLICY payrolls_staff_insert
  ON public.payrolls
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_payroll_staff());

CREATE POLICY payrolls_staff_update
  ON public.payrolls
  FOR UPDATE
  TO authenticated
  USING (public.is_payroll_staff())
  WITH CHECK (public.is_payroll_staff());

CREATE POLICY payrolls_admin_delete
  ON public.payrolls
  FOR DELETE
  TO authenticated
  USING (public.is_payroll_admin());

REVOKE ALL ON public.payrolls FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payrolls TO authenticated;

-- ---------------------------------------------------------------------------
-- payroll_batches
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payroll_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payroll_batches FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payroll_batches_auth_all ON public.payroll_batches;
DROP POLICY IF EXISTS payroll_batches_staff_all ON public.payroll_batches;

CREATE POLICY payroll_batches_staff_all
  ON public.payroll_batches
  FOR ALL
  TO authenticated
  USING (public.is_payroll_staff())
  WITH CHECK (public.is_payroll_staff());

REVOKE ALL ON public.payroll_batches FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_batches TO authenticated;

-- ---------------------------------------------------------------------------
-- payroll_batch_rows
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payroll_batch_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payroll_batch_rows FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payroll_batch_rows_auth_all ON public.payroll_batch_rows;
DROP POLICY IF EXISTS payroll_batch_rows_staff_all ON public.payroll_batch_rows;

CREATE POLICY payroll_batch_rows_staff_all
  ON public.payroll_batch_rows
  FOR ALL
  TO authenticated
  USING (public.is_payroll_staff())
  WITH CHECK (public.is_payroll_staff());

REVOKE ALL ON public.payroll_batch_rows FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_batch_rows TO authenticated;

-- ---------------------------------------------------------------------------
-- payroll_formulas
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payroll_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payroll_formulas FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payroll_formulas_auth_all ON public.payroll_formulas;
DROP POLICY IF EXISTS payroll_formulas_staff_all ON public.payroll_formulas;

CREATE POLICY payroll_formulas_staff_all
  ON public.payroll_formulas
  FOR ALL
  TO authenticated
  USING (public.is_payroll_staff())
  WITH CHECK (public.is_payroll_staff());

REVOKE ALL ON public.payroll_formulas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_formulas TO authenticated;

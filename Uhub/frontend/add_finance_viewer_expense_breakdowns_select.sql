-- Allow finance/analytics roles to read expense line-item breakdowns for all expenses.
-- Without this, finance_viewer sees expense totals but breakdown rows are hidden by RLS.

DROP POLICY IF EXISTS "Analytics roles can view all expense breakdowns" ON public.expense_breakdowns;

CREATE POLICY "Analytics roles can view all expense breakdowns"
  ON public.expense_breakdowns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role IN (
          'admin',
          'finance_viewer',
          'it_management',
          'manager',
          'hr_manager',
          'cs_manager',
          'driver_management',
          'operation_management'
        )
    )
  );

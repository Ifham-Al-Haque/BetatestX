-- Optional, manually-entered line items for an expense.
-- Run this file in the UHub Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.expense_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(trim(label)) > 0),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_breakdowns_expense_id
  ON public.expense_breakdowns(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_breakdowns_expense_sort
  ON public.expense_breakdowns(expense_id, sort_order);

ALTER TABLE public.expense_breakdowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expense breakdowns" ON public.expense_breakdowns;
CREATE POLICY "Users can view own expense breakdowns"
  ON public.expense_breakdowns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses
      WHERE expenses.id = expense_breakdowns.expense_id
        AND expenses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add own expense breakdowns" ON public.expense_breakdowns;
CREATE POLICY "Users can add own expense breakdowns"
  ON public.expense_breakdowns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.expenses
      WHERE expenses.id = expense_breakdowns.expense_id
        AND expenses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own expense breakdowns" ON public.expense_breakdowns;
CREATE POLICY "Users can update own expense breakdowns"
  ON public.expense_breakdowns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses
      WHERE expenses.id = expense_breakdowns.expense_id
        AND expenses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.expenses
      WHERE expenses.id = expense_breakdowns.expense_id
        AND expenses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own expense breakdowns" ON public.expense_breakdowns;
CREATE POLICY "Users can delete own expense breakdowns"
  ON public.expense_breakdowns
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses
      WHERE expenses.id = expense_breakdowns.expense_id
        AND expenses.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.expense_breakdowns
  TO authenticated;

COMMENT ON TABLE public.expense_breakdowns IS
  'Optional manually-entered line items that explain an expense total.';

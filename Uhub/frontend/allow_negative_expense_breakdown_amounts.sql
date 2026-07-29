-- Allow negative amounts on expense breakdown line items (credits, waivers, charge reversals).
-- Replaces CHECK (amount > 0) with CHECK (amount <> 0).

ALTER TABLE public.expense_breakdowns
  DROP CONSTRAINT IF EXISTS expense_breakdowns_amount_check;

ALTER TABLE public.expense_breakdowns
  ADD CONSTRAINT expense_breakdowns_amount_check CHECK (amount <> 0);

COMMENT ON COLUMN public.expense_breakdowns.amount IS
  'Line item amount. Use negative values for credits, waivers, or reversals.';

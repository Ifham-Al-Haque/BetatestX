-- Add the billing timing used to determine which service month a payment covers.
-- Run this file in the UHub Supabase project.

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS billing_type TEXT;

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_billing_type_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_billing_type_check
  CHECK (
    billing_type IS NULL
    OR billing_type IN ('pre_charge', 'post_charge')
  );

COMMENT ON COLUMN public.expenses.billing_type IS
  'pre_charge: payment covers the current/payment month; post_charge: payment covers the previous month usage.';

-- =============================================================================
-- Optional expense fields: notes + receipt attachment metadata
-- Run in Supabase SQL Editor.
--
-- Storage: create bucket "expense-receipts" (public) in Dashboard → Storage.
-- Policies for authenticated users on bucket_id = 'expense-receipts' (see comments below).
-- =============================================================================

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

COMMENT ON COLUMN public.expenses.notes IS 'Optional free-text notes about the expense';
COMMENT ON COLUMN public.expenses.receipt_url IS 'Public URL of uploaded invoice/receipt file';
COMMENT ON COLUMN public.expenses.receipt_file_name IS 'Original filename of the uploaded receipt';

-- Dashboard → Storage → expense-receipts → Policies (authenticated):
--   INSERT: bucket_id = 'expense-receipts'
--   SELECT: bucket_id = 'expense-receipts'
--   UPDATE: bucket_id = 'expense-receipts'
--   DELETE: bucket_id = 'expense-receipts'

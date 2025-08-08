-- Add invoice generation date and invoice due date columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_generation_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_due_date DATE;

-- Add comments to describe the columns
COMMENT ON COLUMN expenses.invoice_generation_date IS 'Date when the invoice was generated';
COMMENT ON COLUMN expenses.invoice_due_date IS 'Date when the invoice payment is due';

-- Update existing records with default values (optional)
-- Set invoice generation date to date_paid if not set
UPDATE expenses 
SET invoice_generation_date = date_paid 
WHERE invoice_generation_date IS NULL;

-- Set invoice due date to 30 days after generation date if not set
UPDATE expenses 
SET invoice_due_date = invoice_generation_date + INTERVAL '30 days'
WHERE invoice_due_date IS NULL AND invoice_generation_date IS NOT NULL;

-- Add invoice_number column to expenses table
ALTER TABLE expenses 
ADD COLUMN invoice_number VARCHAR(255);

-- Add comment to describe the column
COMMENT ON COLUMN expenses.invoice_number IS 'Invoice number for the expense record';

-- Update existing records with a default invoice number format
UPDATE expenses 
SET invoice_number = 'INV-' || EXTRACT(YEAR FROM date_paid) || '-' || LPAD(EXTRACT(MONTH FROM date_paid)::TEXT, 2, '0') || '-' || LPAD(id::TEXT, 6, '0')
WHERE invoice_number IS NULL;

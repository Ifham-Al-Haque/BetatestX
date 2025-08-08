-- Temporarily disable RLS on expenses table for testing
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Add invoice_number column if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255);

-- Re-enable RLS after testing (uncomment when done)
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

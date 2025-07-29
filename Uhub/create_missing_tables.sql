-- Create Missing Tables Script
-- Run this in your Supabase SQL editor to create the missing tables

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    description TEXT,
    category TEXT,
    vendor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date_paid DATE NOT NULL,
    department TEXT,
    category TEXT,
    description TEXT,
    vendor TEXT,
    payment_method TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upcoming_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS upcoming_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'overdue', 'paid')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT,
    vendor TEXT,
    description TEXT,
    recurring BOOLEAN DEFAULT false,
    recurring_interval TEXT, -- 'monthly', 'quarterly', 'yearly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample data for testing
INSERT INTO payments (title, amount, payment_date, due_date, status, category, vendor) VALUES
    ('AWS Cloud Services', 1500.00, '2025-07-15', '2025-07-15', 'paid', 'Cloud Services', 'Amazon Web Services'),
    ('Office 365 License', 800.00, '2025-07-20', '2025-07-20', 'paid', 'Software License', 'Microsoft'),
    ('Internet Service', 200.00, '2025-07-25', '2025-07-25', 'pending', 'Utilities', 'Etisalat'),
    ('Software License Renewal', 1200.00, '2025-08-01', '2025-08-01', 'pending', 'Software License', 'Adobe')
ON CONFLICT DO NOTHING;

INSERT INTO expenses (title, amount, date_paid, department, category, vendor) VALUES
    ('Office Supplies', 150.00, '2025-07-01', 'IT', 'Office Supplies', 'Office Depot'),
    ('Cloud Storage', 300.00, '2025-07-05', 'IT', 'Cloud Services', 'Google Cloud'),
    ('Software License', 500.00, '2025-07-10', 'IT', 'Software License', 'JetBrains'),
    ('Internet Service', 200.00, '2025-07-15', 'IT', 'Utilities', 'Etisalat'),
    ('Office Furniture', 800.00, '2025-07-20', 'HR', 'Furniture', 'IKEA'),
    ('Marketing Materials', 400.00, '2025-07-25', 'Marketing', 'Marketing', 'Print Shop')
ON CONFLICT DO NOTHING;

INSERT INTO upcoming_payments (title, amount, due_date, status, priority, category, vendor, recurring) VALUES
    ('Atlassian License', 1200.00, '2025-08-01', 'upcoming', 'high', 'Software License', 'Atlassian', true),
    ('Ziwo CRM', 800.00, '2025-08-05', 'upcoming', 'medium', 'Software License', 'Ziwo', true),
    ('Office Rent', 5000.00, '2025-08-01', 'upcoming', 'urgent', 'Rent', 'Property Management', true),
    ('Insurance Premium', 2000.00, '2025-08-15', 'upcoming', 'high', 'Insurance', 'Insurance Company', false)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date_paid);
CREATE INDEX IF NOT EXISTS idx_expenses_department ON expenses(department);
CREATE INDEX IF NOT EXISTS idx_upcoming_payments_due_date ON upcoming_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_upcoming_payments_status ON upcoming_payments(status);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
CREATE POLICY "Enable read access for all authenticated users" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for expenses
CREATE POLICY "Enable read access for all authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for upcoming_payments
CREATE POLICY "Enable read access for all authenticated users" ON upcoming_payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON upcoming_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON upcoming_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify the tables were created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('payments', 'expenses', 'upcoming_payments')
ORDER BY table_name, ordinal_position; 
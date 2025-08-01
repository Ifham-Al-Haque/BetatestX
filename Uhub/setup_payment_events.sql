-- =====================================================
-- SETUP PAYMENT EVENTS SYSTEM
-- Creates necessary tables for payment events management
-- =====================================================

-- Step 1: Create payment_events table
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    category TEXT DEFAULT 'Other',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    service_provider TEXT,
    invoice_number TEXT,
    payment_method TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN DEFAULT FALSE
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_events_due_date ON payment_events(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON payment_events(status);
CREATE INDEX IF NOT EXISTS idx_payment_events_category ON payment_events(category);
CREATE INDEX IF NOT EXISTS idx_payment_events_priority ON payment_events(priority);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_by ON payment_events(created_by);

-- Step 3: Create payments table (if not exists) - for historical payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_event_id UUID REFERENCES payment_events(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_payment_event_id ON payments(payment_event_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Step 5: Disable RLS for now (enable later with proper policies)
ALTER TABLE payment_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Step 6: Insert sample payment events
INSERT INTO payment_events (title, description, amount, due_date, status, category, priority, service_provider) VALUES
    ('Atlassian License', 'Jira & Confluence License Renewal', 2500.00, (CURRENT_DATE + INTERVAL '5 days'), 'pending', 'Software License', 'high', 'Atlassian'),
    ('Ziwo Call Center', 'Call Center Software Subscription', 1800.00, (CURRENT_DATE + INTERVAL '12 days'), 'pending', 'Communication', 'medium', 'Ziwo'),
    ('AWS Cloud Services', 'Cloud Infrastructure Services', 3200.00, (CURRENT_DATE + INTERVAL '2 days'), 'pending', 'Infrastructure', 'urgent', 'Amazon Web Services'),
    ('Microsoft 365', 'Office Suite License Renewal', 1500.00, (CURRENT_DATE + INTERVAL '8 days'), 'pending', 'Software License', 'medium', 'Microsoft'),
    ('Zoom Pro', 'Video Conferencing Subscription', 800.00, (CURRENT_DATE + INTERVAL '15 days'), 'pending', 'Communication', 'low', 'Zoom'),
    ('Google Workspace', 'Email and Collaboration Tools', 1200.00, (CURRENT_DATE - INTERVAL '3 days'), 'overdue', 'Software License', 'high', 'Google'),
    ('Slack Premium', 'Team Communication Platform', 900.00, (CURRENT_DATE + INTERVAL '20 days'), 'pending', 'Communication', 'medium', 'Slack'),
    ('Adobe Creative Suite', 'Design Software License', 2800.00, (CURRENT_DATE + INTERVAL '1 day'), 'pending', 'Software License', 'urgent', 'Adobe')
ON CONFLICT DO NOTHING;

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger for payment_events table
DROP TRIGGER IF EXISTS update_payment_events_updated_at ON payment_events;
CREATE TRIGGER update_payment_events_updated_at
    BEFORE UPDATE ON payment_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create function to automatically update status based on due date
CREATE OR REPLACE FUNCTION update_payment_event_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status to overdue if due date has passed and status is still pending
    IF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
        NEW.status = 'overdue';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create trigger for automatic status updates
DROP TRIGGER IF EXISTS update_payment_event_status_trigger ON payment_events;
CREATE TRIGGER update_payment_event_status_trigger
    BEFORE INSERT OR UPDATE ON payment_events
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_event_status();

-- Step 11: Show table structures
SELECT '=== PAYMENT_EVENTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== PAYMENTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 12: Show sample data
SELECT '=== SAMPLE PAYMENT EVENTS ===' as info;
SELECT title, amount, due_date, status, category, priority
FROM payment_events
ORDER BY due_date ASC
LIMIT 5;

SELECT '=== PAYMENT EVENTS SYSTEM SETUP COMPLETE ===' as info;
SELECT 'Your payment events system is now ready!' as success_message; 
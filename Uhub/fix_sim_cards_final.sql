-- FINAL VERSION: Complete Fix for SIM Cards Table
-- This script will create the table if it doesn't exist and fix any structural issues
-- All reserved keywords are properly quoted

-- Step 1: Drop the table if it exists (to ensure clean creation)
DROP TABLE IF EXISTS sim_cards CASCADE;

-- Step 2: Create the sim_cards table with the correct structure
CREATE TABLE sim_cards (
    id BIGSERIAL PRIMARY KEY,
    sim_number VARCHAR(20) NOT NULL UNIQUE,
    package_name VARCHAR(100) NOT NULL,
    package_type VARCHAR(50) DEFAULT 'Default' CHECK (package_type IN ('Default', 'Custom', 'Corporate', 'Premium', 'Basic')),
    package_benefits TEXT,
    monthly_cost DECIMAL(10,2),
    data_limit VARCHAR(50),
    voice_minutes VARCHAR(50),
    sms_limit VARCHAR(50),
    "current_user" VARCHAR(100),
    "previous_user" VARCHAR(100),
    department VARCHAR(50) CHECK (department IN ('IT', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Management', 'Other')),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Pending', 'Expired')),
    activation_date DATE,
    expiry_date DATE,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sim_cards_sim_number ON sim_cards(sim_number);
CREATE INDEX IF NOT EXISTS idx_sim_cards_status ON sim_cards(status);
CREATE INDEX IF NOT EXISTS idx_sim_cards_department ON sim_cards(department);
CREATE INDEX IF NOT EXISTS idx_sim_cards_current_user ON sim_cards("current_user");
CREATE INDEX IF NOT EXISTS idx_sim_cards_user_id ON sim_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_cards_expiry_date ON sim_cards(expiry_date);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE sim_cards ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for development (you can adjust these later for production)
-- Policy for users to view all SIM cards
CREATE POLICY "Users can view all SIM cards" ON sim_cards
    FOR SELECT USING (true);

-- Policy for authenticated users to insert SIM cards
CREATE POLICY "Authenticated users can insert SIM cards" ON sim_cards
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update SIM cards
CREATE POLICY "Authenticated users can update SIM cards" ON sim_cards
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete SIM cards
CREATE POLICY "Authenticated users can delete SIM cards" ON sim_cards
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 6: Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger to automatically update updated_at
CREATE TRIGGER update_sim_cards_updated_at 
    BEFORE UPDATE ON sim_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Insert sample data
INSERT INTO sim_cards (
    sim_number,
    package_name,
    package_type,
    package_benefits,
    monthly_cost,
    data_limit,
    voice_minutes,
    sms_limit,
    "current_user",
    "previous_user",
    department,
    status,
    activation_date,
    expiry_date,
    notes
) VALUES 
(
    '+971501234567',
    'Corporate Unlimited',
    'Corporate',
    'Unlimited data, voice, and SMS for corporate use',
    299.00,
    'Unlimited',
    'Unlimited',
    'Unlimited',
    'Ahmed Al Mansouri',
    'Sarah Johnson',
    'IT',
    'Active',
    '2024-01-15',
    '2025-01-15',
    'Primary corporate line for IT department'
),
(
    '+971502345678',
    'Basic Plan',
    'Default',
    '5GB data, 500 minutes, 100 SMS',
    99.00,
    '5GB',
    '500 minutes',
    '100 SMS',
    'Fatima Hassan',
    '',
    'Sales',
    'Active',
    '2024-03-01',
    '2025-03-01',
    'Sales team member line'
),
(
    '+971503456789',
    'Premium Business',
    'Premium',
    '20GB data, unlimited voice, 500 SMS',
    199.00,
    '20GB',
    'Unlimited',
    '500 SMS',
    '',
    'Mohammed Ali',
    'Marketing',
    'Inactive',
    '2023-06-01',
    '2024-06-01',
    'Currently unassigned, available for new user'
);

-- Step 9: Create the sim_card_stats view
CREATE OR REPLACE VIEW sim_card_stats AS
SELECT 
    COUNT(*) as total_sim_cards,
    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_sim_cards,
    COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_sim_cards,
    COUNT(CASE WHEN status = 'Suspended' THEN 1 END) as suspended_sim_cards,
    COUNT(CASE WHEN "current_user" IS NOT NULL AND "current_user" != '' THEN 1 END) as assigned_sim_cards,
    COUNT(CASE WHEN "current_user" IS NULL OR "current_user" = '' THEN 1 END) as unassigned_sim_cards,
    SUM(monthly_cost) as total_monthly_cost,
    COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_sim_cards,
    COUNT(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon
FROM sim_cards;

-- Step 10: Grant necessary permissions
GRANT ALL ON sim_cards TO authenticated;
GRANT ALL ON sim_card_stats TO authenticated;
GRANT USAGE ON SEQUENCE sim_cards_id_seq TO authenticated;

-- Step 11: Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sim_cards' 
ORDER BY ordinal_position;

-- Step 12: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sim_cards';

-- Step 13: Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sim_cards';

-- Step 14: Test the table with a simple query
SELECT COUNT(*) as total_sim_cards FROM sim_cards;

-- Step 15: Test the stats view
SELECT * FROM sim_card_stats;

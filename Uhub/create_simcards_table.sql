-- Create SIM Cards Table for Supabase Database
-- This table stores all SIM card information for the company

-- Create the sim_cards table
CREATE TABLE IF NOT EXISTS sim_cards (
    id BIGSERIAL PRIMARY KEY,
    sim_number VARCHAR(20) NOT NULL UNIQUE,
    package_name VARCHAR(100) NOT NULL,
    package_type VARCHAR(50) DEFAULT 'Default' CHECK (package_type IN ('Default', 'Custom', 'Corporate', 'Premium', 'Basic')),
    package_benefits TEXT,
    monthly_cost DECIMAL(10,2),
    data_limit VARCHAR(50),
    voice_minutes VARCHAR(50),
    sms_limit VARCHAR(50),
    current_user VARCHAR(100),
    previous_user VARCHAR(100),
    department VARCHAR(50) CHECK (department IN ('IT', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Management', 'Other')),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended', 'Pending', 'Expired')),
    activation_date DATE,
    expiry_date DATE,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sim_cards_sim_number ON sim_cards(sim_number);
CREATE INDEX IF NOT EXISTS idx_sim_cards_status ON sim_cards(status);
CREATE INDEX IF NOT EXISTS idx_sim_cards_department ON sim_cards(department);
CREATE INDEX IF NOT EXISTS idx_sim_cards_current_user ON sim_cards(current_user);
CREATE INDEX IF NOT EXISTS idx_sim_cards_user_id ON sim_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_cards_expiry_date ON sim_cards(expiry_date);

-- Enable Row Level Security (RLS)
ALTER TABLE sim_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to view all SIM cards (adjust based on your security requirements)
CREATE POLICY "Users can view all SIM cards" ON sim_cards
    FOR SELECT USING (true);

-- Policy for users to insert their own SIM cards
CREATE POLICY "Users can insert SIM cards" ON sim_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update SIM cards they created
CREATE POLICY "Users can update SIM cards" ON sim_cards
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete SIM cards they created
CREATE POLICY "Users can delete SIM cards" ON sim_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sim_cards_updated_at 
    BEFORE UPDATE ON sim_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO sim_cards (
    sim_number,
    package_name,
    package_type,
    package_benefits,
    monthly_cost,
    data_limit,
    voice_minutes,
    sms_limit,
    current_user,
    previous_user,
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
),
(
    '+971504567890',
    'Enterprise Plan',
    'Corporate',
    '50GB data, unlimited voice, unlimited SMS, international calls',
    399.00,
    '50GB',
    'Unlimited',
    'Unlimited',
    'Omar Khalil',
    '',
    'Management',
    'Active',
    '2024-02-01',
    '2025-02-01',
    'Executive management line'
),
(
    '+971505678901',
    'Standard Plan',
    'Default',
    '10GB data, 1000 minutes, 200 SMS',
    149.00,
    '10GB',
    '1000 minutes',
    '200 SMS',
    'Layla Ahmed',
    'Khalid Hassan',
    'Finance',
    'Active',
    '2024-04-15',
    '2025-04-15',
    'Finance department line'
),
(
    '+971506789012',
    'Custom Plan',
    'Custom',
    '15GB data, 800 minutes, 150 SMS, free weekend calls',
    179.00,
    '15GB',
    '800 minutes',
    '150 SMS',
    '',
    'Aisha Mohammed',
    'HR',
    'Suspended',
    '2023-12-01',
    '2024-12-01',
    'Temporarily suspended due to non-payment'
);

-- Create a view for SIM card statistics
CREATE OR REPLACE VIEW sim_card_stats AS
SELECT 
    COUNT(*) as total_sim_cards,
    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_sim_cards,
    COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive_sim_cards,
    COUNT(CASE WHEN status = 'Suspended' THEN 1 END) as suspended_sim_cards,
    COUNT(CASE WHEN current_user IS NOT NULL AND current_user != '' THEN 1 END) as assigned_sim_cards,
    COUNT(CASE WHEN current_user IS NULL OR current_user = '' THEN 1 END) as unassigned_sim_cards,
    SUM(monthly_cost) as total_monthly_cost,
    COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_sim_cards,
    COUNT(CASE WHEN expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon
FROM sim_cards;

-- Create a function to get SIM cards by department
CREATE OR REPLACE FUNCTION get_sim_cards_by_department(dept_name VARCHAR)
RETURNS TABLE (
    id BIGINT,
    sim_number VARCHAR,
    package_name VARCHAR,
    current_user VARCHAR,
    status VARCHAR,
    monthly_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.sim_number,
        sc.package_name,
        sc.current_user,
        sc.status,
        sc.monthly_cost
    FROM sim_cards sc
    WHERE sc.department = dept_name
    ORDER BY sc.sim_number;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust based on your Supabase setup)
-- These permissions are typically handled automatically by Supabase
-- but you may need to adjust based on your specific requirements

-- Example usage queries:

-- Get all active SIM cards
-- SELECT * FROM sim_cards WHERE status = 'Active';

-- Get SIM cards expiring in the next 30 days
-- SELECT * FROM sim_cards WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- Get total monthly cost by department
-- SELECT department, SUM(monthly_cost) as total_cost FROM sim_cards GROUP BY department;

-- Get unassigned SIM cards
-- SELECT * FROM sim_cards WHERE current_user IS NULL OR current_user = '';

-- Get SIM card statistics
-- SELECT * FROM sim_card_stats;

-- Alternative Fix: Add Missing Columns to Existing SIM Cards Table
-- Use this if you want to keep existing data

-- Step 1: Add the missing current_user column (quoted because it's a reserved keyword)
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS "current_user" VARCHAR(100);

-- Step 2: Add the missing previous_user column
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS "previous_user" VARCHAR(100);

-- Step 3: Add other missing columns that might not exist
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS package_benefits TEXT;
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS data_limit VARCHAR(50);
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS voice_minutes VARCHAR(50);
ALTER TABLE sim_cards ADD COLUMN IF NOT EXISTS sms_limit VARCHAR(50);

-- Step 4: Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_sim_cards_sim_number ON sim_cards(sim_number);
CREATE INDEX IF NOT EXISTS idx_sim_cards_status ON sim_cards(status);
CREATE INDEX IF NOT EXISTS idx_sim_cards_department ON sim_cards(department);
CREATE INDEX IF NOT EXISTS idx_sim_cards_current_user ON sim_cards("current_user");
CREATE INDEX IF NOT EXISTS idx_sim_cards_user_id ON sim_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_cards_expiry_date ON sim_cards(expiry_date);

-- Step 5: Enable Row Level Security (RLS) if not already enabled
ALTER TABLE sim_cards ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all SIM cards" ON sim_cards;
DROP POLICY IF EXISTS "Users can insert SIM cards" ON sim_cards;
DROP POLICY IF EXISTS "Users can update SIM cards" ON sim_cards;
DROP POLICY IF EXISTS "Users can delete SIM cards" ON sim_cards;

-- Step 7: Create new RLS policies
CREATE POLICY "Users can view all SIM cards" ON sim_cards
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert SIM cards" ON sim_cards
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update SIM cards" ON sim_cards
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete SIM cards" ON sim_cards
    FOR DELETE USING (auth.role() = 'authenticated');

-- Step 8: Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger to automatically update updated_at (if it doesn't exist)
DROP TRIGGER IF EXISTS update_sim_cards_updated_at ON sim_cards;
CREATE TRIGGER update_sim_cards_updated_at 
    BEFORE UPDATE ON sim_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Create or replace the sim_card_stats view
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

-- Step 11: Grant necessary permissions
GRANT ALL ON sim_cards TO authenticated;
GRANT ALL ON sim_card_stats TO authenticated;
GRANT USAGE ON SEQUENCE sim_cards_id_seq TO authenticated;

-- Step 12: Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sim_cards' 
ORDER BY ordinal_position;

-- Step 13: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sim_cards';

-- Step 14: Check policies
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

-- Step 15: Test the table with a simple query
SELECT COUNT(*) as total_sim_cards FROM sim_cards;

-- Step 16: Test the stats view
SELECT * FROM sim_card_stats;

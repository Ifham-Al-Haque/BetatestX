-- Database Check and Fix Script
-- Run this in your Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('employees', 'expenses', 'assets', 'payment_events', 'attendance', 'users') 
    THEN '✅ Exists' 
    ELSE '❌ Missing' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('employees', 'expenses', 'assets', 'payment_events', 'attendance', 'users');

-- 2. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('employees', 'expenses', 'assets', 'payment_events', 'attendance', 'users');

-- 3. Create missing payment_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  department TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on payment_events
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policy for payment_events (allow all authenticated users to read)
DROP POLICY IF EXISTS "Allow authenticated users to read payment_events" ON payment_events;
CREATE POLICY "Allow authenticated users to read payment_events" 
  ON payment_events FOR SELECT 
  TO authenticated 
  USING (true);

-- 6. Create RLS policy for payment_events (allow authenticated users to insert/update/delete)
DROP POLICY IF EXISTS "Allow authenticated users to modify payment_events" ON payment_events;
CREATE POLICY "Allow authenticated users to modify payment_events" 
  ON payment_events FOR ALL 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- 7. Check if expenses table has the correct columns
DO $$
BEGIN
  -- Add amount_aed column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'amount_aed') THEN
    ALTER TABLE expenses ADD COLUMN amount_aed DECIMAL(10,2);
  END IF;
  
  -- Add date_paid column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'date_paid') THEN
    ALTER TABLE expenses ADD COLUMN date_paid DATE;
  END IF;
  
  -- Add service_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'service_name') THEN
    ALTER TABLE expenses ADD COLUMN service_name TEXT;
  END IF;
END $$;

-- 8. Insert sample payment events if table is empty
INSERT INTO payment_events (title, description, amount, due_date, status, department, category)
SELECT 
  'Atlassian Subscription',
  'Monthly Atlassian Jira and Confluence subscription',
  299.00,
  CURRENT_DATE + INTERVAL '15 days',
  'pending',
  'IT',
  'Software'
WHERE NOT EXISTS (SELECT 1 FROM payment_events LIMIT 1);

INSERT INTO payment_events (title, description, amount, due_date, status, department, category)
SELECT 
  'Ziwo CRM License',
  'Monthly Ziwo CRM platform license',
  199.00,
  CURRENT_DATE + INTERVAL '20 days',
  'pending',
  'Sales',
  'Software'
WHERE NOT EXISTS (SELECT 1 FROM payment_events WHERE title = 'Ziwo CRM License');

-- 9. Final verification
SELECT 'Database check complete!' as status; 
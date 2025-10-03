-- Ensure rental_agreements table has the necessary fields for the delivery checklist system

-- Create rental_agreements table if it doesn't exist
CREATE TABLE IF NOT EXISTS rental_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  rental_start_date TIMESTAMP WITH TIME ZONE,
  rental_end_date TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC(10,2) DEFAULT 0,
  vehicle_id UUID,
  driver_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'Medium',
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Add any missing columns if they don't exist
DO $$ 
BEGIN
  -- Add customer_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'customer_name') THEN
    ALTER TABLE rental_agreements ADD COLUMN customer_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Customer';
  END IF;
  
  -- Add customer_phone if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'customer_phone') THEN
    ALTER TABLE rental_agreements ADD COLUMN customer_phone VARCHAR(50);
  END IF;
  
  -- Add customer_email if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'customer_email') THEN
    ALTER TABLE rental_agreements ADD COLUMN customer_email VARCHAR(255);
  END IF;
  
  -- Add rental_start_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'rental_start_date') THEN
    ALTER TABLE rental_agreements ADD COLUMN rental_start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add rental_end_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'rental_end_date') THEN
    ALTER TABLE rental_agreements ADD COLUMN rental_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add total_amount if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'total_amount') THEN
    ALTER TABLE rental_agreements ADD COLUMN total_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  -- Add vehicle_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'vehicle_id') THEN
    ALTER TABLE rental_agreements ADD COLUMN vehicle_id UUID;
  END IF;
  
  -- Add driver_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'driver_id') THEN
    ALTER TABLE rental_agreements ADD COLUMN driver_id UUID;
  END IF;
  
  -- Add status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'status') THEN
    ALTER TABLE rental_agreements ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
  END IF;
  
  -- Add priority if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'priority') THEN
    ALTER TABLE rental_agreements ADD COLUMN priority VARCHAR(20) DEFAULT 'Medium';
  END IF;
  
  -- Add special_requirements if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'special_requirements') THEN
    ALTER TABLE rental_agreements ADD COLUMN special_requirements TEXT;
  END IF;
  
  -- Add created_by if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'created_by') THEN
    ALTER TABLE rental_agreements ADD COLUMN created_by UUID;
  END IF;
  
  -- Add updated_by if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rental_agreements' AND column_name = 'updated_by') THEN
    ALTER TABLE rental_agreements ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rental_agreements_customer_name ON rental_agreements(customer_name);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_customer_phone ON rental_agreements(customer_phone);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_status ON rental_agreements(status);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_priority ON rental_agreements(priority);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_created_at ON rental_agreements(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for rental_agreements (adjust based on your needs)
DROP POLICY IF EXISTS "rental_agreements_select_policy" ON rental_agreements;
CREATE POLICY "rental_agreements_select_policy" ON rental_agreements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rental_agreements_insert_policy" ON rental_agreements;
CREATE POLICY "rental_agreements_insert_policy" ON rental_agreements
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rental_agreements_update_policy" ON rental_agreements;
CREATE POLICY "rental_agreements_update_policy" ON rental_agreements
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "rental_agreements_delete_policy" ON rental_agreements;
CREATE POLICY "rental_agreements_delete_policy" ON rental_agreements
  FOR DELETE USING (true);

-- Insert some sample rental agreements to test with
INSERT INTO rental_agreements (
  customer_name, customer_phone, customer_email, 
  rental_start_date, rental_end_date, total_amount,
  status, priority, special_requirements, created_by
) VALUES 
(
  'Ahmed Al-Rashid', 
  '+971-50-123-4567', 
  'ahmed@example.com',
  NOW(), 
  NOW() + INTERVAL '7 days', 
  250.00,
  'pending', 
  'High', 
  'Customer prefers morning delivery',
  '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'
),
(
  'Sarah Johnson', 
  '+971-50-555-1234', 
  'sarah@example.com',
  NOW(), 
  NOW() + INTERVAL '3 days', 
  180.00,
  'confirmed', 
  'Medium', 
  'Fragile items - handle with care',
  '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'
),
(
  'Fatima Al-Zahra', 
  '+971-50-999-8888', 
  'fatima@example.com',
  NOW(), 
  NOW() + INTERVAL '14 days', 
  320.00,
  'active', 
  'Urgent', 
  'Customer requires signature confirmation',
  '24e0b410-74d9-4ce1-a8b1-b26aa35850e0'
)
ON CONFLICT DO NOTHING;


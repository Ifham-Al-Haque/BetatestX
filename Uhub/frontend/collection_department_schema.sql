-- =====================================================
-- Collection Department Management System
-- =====================================================
-- This schema supports the collection department for 
-- tracking customer payments, reminders, and checklists
-- =====================================================

-- 1. Collection Payments Table
-- Tracks all customer payment obligations
CREATE TABLE IF NOT EXISTS collection_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer Information
  customer_id UUID,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  
  -- Rental Agreement Link
  rental_agreement_id UUID REFERENCES fleet_rental_agreements(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_amount NUMERIC(10,2) NOT NULL,
  payment_due_date DATE NOT NULL,
  payment_type VARCHAR(50) DEFAULT 'rental', -- 'rental', 'penalty', 'deposit', 'other'
  
  -- Payment Status
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance_remaining NUMERIC(10,2) NOT NULL,
  
  -- Collection Details
  collection_priority VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
  collection_status VARCHAR(50) DEFAULT 'not_contacted', -- 'not_contacted', 'contacted', 'promised_to_pay', 'follow_up_required', 'collected'
  assigned_collector_id UUID, -- User ID of collection staff
  
  -- Additional Info
  notes TEXT,
  payment_method VARCHAR(50), -- 'cash', 'card', 'bank_transfer', 'cheque'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_date TIMESTAMP WITH TIME ZONE,
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_by UUID,
  updated_by UUID
);

-- 2. Collection Reminders Table
-- Automated reminder system for payment due dates
CREATE TABLE IF NOT EXISTS collection_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to Payment
  payment_id UUID REFERENCES collection_payments(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  
  -- Reminder Details
  reminder_date DATE NOT NULL,
  reminder_time TIME DEFAULT '09:00:00',
  reminder_type VARCHAR(50) DEFAULT 'payment_due', -- 'payment_due', 'overdue', 'follow_up', 'custom'
  
  -- Reminder Message
  reminder_title VARCHAR(255) NOT NULL,
  reminder_message TEXT NOT NULL,
  
  -- Status
  reminder_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'acknowledged', 'snoozed', 'completed', 'cancelled'
  is_automated BOOLEAN DEFAULT true,
  
  -- Notification Settings
  notify_via_email BOOLEAN DEFAULT true,
  notify_via_sms BOOLEAN DEFAULT false,
  notify_in_app BOOLEAN DEFAULT true,
  
  -- Assignment
  assigned_to UUID, -- Collection staff member
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,
  
  -- Actions
  action_taken TEXT,
  action_date TIMESTAMP WITH TIME ZONE,
  next_reminder_date DATE,
  
  -- Snooze
  snoozed_until TIMESTAMP WITH TIME ZONE,
  snooze_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_by UUID,
  updated_by UUID
);

-- 3. Collection Checklist Table
-- Daily/Weekly checklist for collection activities
CREATE TABLE IF NOT EXISTS collection_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Checklist Item Details
  checklist_title VARCHAR(255) NOT NULL,
  checklist_description TEXT,
  checklist_category VARCHAR(100) DEFAULT 'general', -- 'general', 'follow_up', 'documentation', 'reporting', 'payment_verification'
  
  -- Associated Payment (Optional)
  payment_id UUID REFERENCES collection_payments(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  
  -- Priority and Status
  priority VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled', 'blocked'
  
  -- Assignment
  assigned_to UUID, -- Collection staff member
  assigned_by UUID,
  
  -- Due Date
  due_date DATE,
  due_time TIME,
  
  -- Completion Details
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  completion_notes TEXT,
  
  -- Attachments & Documentation
  attachments_url TEXT[], -- Array of file URLs
  required_documents TEXT[],
  documents_uploaded BOOLEAN DEFAULT false,
  
  -- Tracking
  estimated_time_minutes INTEGER,
  actual_time_minutes INTEGER,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  
  -- Dependencies
  depends_on_checklist_id UUID REFERENCES collection_checklist(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_by UUID,
  updated_by UUID
);

-- 4. Collection Activity Log
-- Track all collection activities and communications
CREATE TABLE IF NOT EXISTS collection_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  payment_id UUID REFERENCES collection_payments(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES collection_reminders(id) ON DELETE SET NULL,
  checklist_id UUID REFERENCES collection_checklist(id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type VARCHAR(100) NOT NULL, -- 'phone_call', 'email', 'sms', 'visit', 'payment_received', 'promise_to_pay', 'other'
  activity_title VARCHAR(255) NOT NULL,
  activity_description TEXT,
  
  -- Customer
  customer_name VARCHAR(255),
  
  -- Staff
  performed_by UUID,
  performed_by_name VARCHAR(255),
  
  -- Outcome
  outcome VARCHAR(100), -- 'successful', 'no_response', 'promised_to_pay', 'partial_payment', 'refused_to_pay', 'wrong_contact'
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Payment Information (if applicable)
  amount_collected NUMERIC(10,2),
  payment_method VARCHAR(50),
  
  -- Timestamps
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Collection Department Settings
-- Configuration for the collection department
CREATE TABLE IF NOT EXISTS collection_department_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reminder Settings
  auto_reminder_days_before INTEGER DEFAULT 3, -- Days before due date to send reminder
  overdue_reminder_frequency_days INTEGER DEFAULT 1, -- How often to remind after overdue
  
  -- Working Hours
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '18:00:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Sunday, 6=Saturday
  
  -- Notification Preferences
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_sms_notifications BOOLEAN DEFAULT false,
  enable_in_app_notifications BOOLEAN DEFAULT true,
  
  -- Escalation Settings
  escalation_days_overdue INTEGER DEFAULT 7,
  escalation_manager_id UUID,
  
  -- Department Info
  department_email VARCHAR(255),
  department_phone VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Collection Payments Indexes
CREATE INDEX IF NOT EXISTS idx_collection_payments_customer_name ON collection_payments(customer_name);
CREATE INDEX IF NOT EXISTS idx_collection_payments_due_date ON collection_payments(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_collection_payments_status ON collection_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_collection_payments_collection_status ON collection_payments(collection_status);
CREATE INDEX IF NOT EXISTS idx_collection_payments_assigned_collector ON collection_payments(assigned_collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_payments_rental_agreement ON collection_payments(rental_agreement_id);

-- Collection Reminders Indexes
CREATE INDEX IF NOT EXISTS idx_collection_reminders_payment_id ON collection_reminders(payment_id);
CREATE INDEX IF NOT EXISTS idx_collection_reminders_date ON collection_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_collection_reminders_status ON collection_reminders(reminder_status);
CREATE INDEX IF NOT EXISTS idx_collection_reminders_assigned_to ON collection_reminders(assigned_to);

-- Collection Checklist Indexes
CREATE INDEX IF NOT EXISTS idx_collection_checklist_payment_id ON collection_checklist(payment_id);
CREATE INDEX IF NOT EXISTS idx_collection_checklist_status ON collection_checklist(status);
CREATE INDEX IF NOT EXISTS idx_collection_checklist_assigned_to ON collection_checklist(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collection_checklist_due_date ON collection_checklist(due_date);
CREATE INDEX IF NOT EXISTS idx_collection_checklist_category ON collection_checklist(checklist_category);

-- Collection Activity Log Indexes
CREATE INDEX IF NOT EXISTS idx_collection_activity_payment_id ON collection_activity_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_collection_activity_date ON collection_activity_log(activity_date);
CREATE INDEX IF NOT EXISTS idx_collection_activity_performed_by ON collection_activity_log(performed_by);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE collection_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_department_settings ENABLE ROW LEVEL SECURITY;

-- Collection Payments Policies
DROP POLICY IF EXISTS "collection_payments_select_policy" ON collection_payments;
CREATE POLICY "collection_payments_select_policy" ON collection_payments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "collection_payments_insert_policy" ON collection_payments;
CREATE POLICY "collection_payments_insert_policy" ON collection_payments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "collection_payments_update_policy" ON collection_payments;
CREATE POLICY "collection_payments_update_policy" ON collection_payments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "collection_payments_delete_policy" ON collection_payments;
CREATE POLICY "collection_payments_delete_policy" ON collection_payments
  FOR DELETE USING (true);

-- Collection Reminders Policies
DROP POLICY IF EXISTS "collection_reminders_select_policy" ON collection_reminders;
CREATE POLICY "collection_reminders_select_policy" ON collection_reminders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "collection_reminders_insert_policy" ON collection_reminders;
CREATE POLICY "collection_reminders_insert_policy" ON collection_reminders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "collection_reminders_update_policy" ON collection_reminders;
CREATE POLICY "collection_reminders_update_policy" ON collection_reminders
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "collection_reminders_delete_policy" ON collection_reminders;
CREATE POLICY "collection_reminders_delete_policy" ON collection_reminders
  FOR DELETE USING (true);

-- Collection Checklist Policies
DROP POLICY IF EXISTS "collection_checklist_select_policy" ON collection_checklist;
CREATE POLICY "collection_checklist_select_policy" ON collection_checklist
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "collection_checklist_insert_policy" ON collection_checklist;
CREATE POLICY "collection_checklist_insert_policy" ON collection_checklist
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "collection_checklist_update_policy" ON collection_checklist;
CREATE POLICY "collection_checklist_update_policy" ON collection_checklist
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "collection_checklist_delete_policy" ON collection_checklist;
CREATE POLICY "collection_checklist_delete_policy" ON collection_checklist
  FOR DELETE USING (true);

-- Collection Activity Log Policies
DROP POLICY IF EXISTS "collection_activity_log_select_policy" ON collection_activity_log;
CREATE POLICY "collection_activity_log_select_policy" ON collection_activity_log
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "collection_activity_log_insert_policy" ON collection_activity_log;
CREATE POLICY "collection_activity_log_insert_policy" ON collection_activity_log
  FOR INSERT WITH CHECK (true);

-- Collection Department Settings Policies
DROP POLICY IF EXISTS "collection_department_settings_select_policy" ON collection_department_settings;
CREATE POLICY "collection_department_settings_select_policy" ON collection_department_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "collection_department_settings_update_policy" ON collection_department_settings;
CREATE POLICY "collection_department_settings_update_policy" ON collection_department_settings
  FOR UPDATE USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_collection_payments_updated_at ON collection_payments;
CREATE TRIGGER update_collection_payments_updated_at 
  BEFORE UPDATE ON collection_payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collection_reminders_updated_at ON collection_reminders;
CREATE TRIGGER update_collection_reminders_updated_at 
  BEFORE UPDATE ON collection_reminders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collection_checklist_updated_at ON collection_checklist;
CREATE TRIGGER update_collection_checklist_updated_at 
  BEFORE UPDATE ON collection_checklist 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate balance remaining
CREATE OR REPLACE FUNCTION calculate_balance_remaining()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance_remaining = NEW.payment_amount - COALESCE(NEW.amount_paid, 0);
    
    -- Auto-update payment status based on payment
    IF NEW.balance_remaining <= 0 THEN
        NEW.payment_status = 'paid';
    ELSIF NEW.amount_paid > 0 AND NEW.balance_remaining > 0 THEN
        NEW.payment_status = 'partially_paid';
    ELSIF NEW.payment_due_date < CURRENT_DATE AND NEW.balance_remaining > 0 THEN
        NEW.payment_status = 'overdue';
    ELSE
        NEW.payment_status = 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS calculate_collection_payment_balance ON collection_payments;
CREATE TRIGGER calculate_collection_payment_balance 
  BEFORE INSERT OR UPDATE ON collection_payments 
  FOR EACH ROW EXECUTE FUNCTION calculate_balance_remaining();

-- Auto-create reminder when payment is created
CREATE OR REPLACE FUNCTION auto_create_payment_reminder()
RETURNS TRIGGER AS $$
DECLARE
    settings RECORD;
BEGIN
    -- Get department settings
    SELECT * INTO settings FROM collection_department_settings LIMIT 1;
    
    -- Create reminder if payment is pending
    IF NEW.payment_status IN ('pending', 'overdue') THEN
        INSERT INTO collection_reminders (
            payment_id,
            customer_name,
            customer_phone,
            customer_email,
            reminder_date,
            reminder_title,
            reminder_message,
            reminder_type,
            is_automated,
            assigned_to,
            created_by
        ) VALUES (
            NEW.id,
            NEW.customer_name,
            NEW.customer_phone,
            NEW.customer_email,
            NEW.payment_due_date - INTERVAL '3 days', -- Default 3 days before
            'Payment Due Reminder',
            'Customer ' || NEW.customer_name || ' has a payment of AED ' || NEW.payment_amount::TEXT || ' due on ' || NEW.payment_due_date::TEXT,
            'payment_due',
            true,
            NEW.assigned_collector_id,
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS auto_create_reminder_on_payment ON collection_payments;
CREATE TRIGGER auto_create_reminder_on_payment 
  AFTER INSERT ON collection_payments 
  FOR EACH ROW EXECUTE FUNCTION auto_create_payment_reminder();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get overdue payments
CREATE OR REPLACE FUNCTION get_overdue_payments()
RETURNS TABLE (
    payment_id UUID,
    customer_name VARCHAR,
    payment_amount NUMERIC,
    days_overdue INTEGER,
    balance_remaining NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        collection_payments.customer_name,
        payment_amount,
        (CURRENT_DATE - payment_due_date)::INTEGER,
        collection_payments.balance_remaining
    FROM collection_payments
    WHERE payment_status = 'overdue' 
      AND balance_remaining > 0
    ORDER BY payment_due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's reminders
CREATE OR REPLACE FUNCTION get_todays_reminders()
RETURNS TABLE (
    reminder_id UUID,
    customer_name VARCHAR,
    reminder_title VARCHAR,
    reminder_message TEXT,
    assigned_to UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        collection_reminders.customer_name,
        collection_reminders.reminder_title,
        collection_reminders.reminder_message,
        collection_reminders.assigned_to
    FROM collection_reminders
    WHERE reminder_date = CURRENT_DATE
      AND reminder_status = 'pending'
    ORDER BY reminder_time ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL SETTINGS DATA
-- =====================================================

INSERT INTO collection_department_settings (
    auto_reminder_days_before,
    overdue_reminder_frequency_days,
    working_hours_start,
    working_hours_end,
    working_days,
    enable_email_notifications,
    enable_in_app_notifications
) VALUES (
    3,
    1,
    '09:00:00',
    '18:00:00',
    ARRAY[1,2,3,4,5],
    true,
    true
) ON CONFLICT DO NOTHING;


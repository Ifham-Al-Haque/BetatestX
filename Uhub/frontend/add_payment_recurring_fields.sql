-- Add recurring payment support to payment_events
-- Run in Supabase SQL Editor

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT DEFAULT NULL
    CHECK (recurrence_frequency IS NULL OR recurrence_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL;

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER DEFAULT 3
    CHECK (reminder_days_before >= 0 AND reminder_days_before <= 90);

COMMENT ON COLUMN payment_events.is_recurring IS 'When true, payment repeats on the same schedule';
COMMENT ON COLUMN payment_events.recurrence_frequency IS 'How often the payment repeats: weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN payment_events.recurrence_end_date IS 'Optional date after which recurrence stops';
COMMENT ON COLUMN payment_events.reminder_days_before IS 'Days before due date to include in upcoming alerts';

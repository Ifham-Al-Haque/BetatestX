-- Run this in Supabase SQL Editor to fix: "it_requests_status_check" violation on delete
-- Your it_requests table may have been created without 'cancelled' in the status check.
-- This adds 'cancelled' (and other common statuses if missing) so soft delete works.

-- Drop existing check constraint (name may vary)
ALTER TABLE it_requests DROP CONSTRAINT IF EXISTS it_requests_status_check;

-- Re-add with full set of statuses including 'cancelled'
ALTER TABLE it_requests ADD CONSTRAINT it_requests_status_check
  CHECK (status IN (
    'open',
    'assigned',
    'in_progress',
    'pending_approval',
    'pending_user',
    'resolved',
    'closed',
    'cancelled'
  ));

-- Verify (optional): list constraint
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.it_requests'::regclass AND contype = 'c';

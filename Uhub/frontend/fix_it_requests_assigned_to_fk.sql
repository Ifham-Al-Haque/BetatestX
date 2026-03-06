-- Fix: allow it_requests.assigned_to to reference users (so "Assign to" can use user IDs).
-- Run this in Supabase SQL Editor if you get: violates foreign key constraint "it_requests_assigned_to_fkey"
-- Your DB may have assigned_to referencing employees(id); this switches it to users(id).

-- Drop existing FK (name may be exactly this)
ALTER TABLE it_requests DROP CONSTRAINT IF EXISTS it_requests_assigned_to_fkey;

-- Re-add FK to users so assignment can use user IDs
ALTER TABLE it_requests ADD CONSTRAINT it_requests_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Optional: set any invalid assigned_to to NULL if you had employee IDs stored
-- UPDATE it_requests SET assigned_to = NULL WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT id FROM users);

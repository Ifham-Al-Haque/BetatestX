-- IT request requester_id: align schema with app + RLS (auth uid)
-- Run in Supabase SQL Editor. Safe to inspect first; run ALTER only if FK target is wrong.

-- 1) See what the FK actually references today
SELECT
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'it_requests'
  AND c.conname = 'it_requests_requester_id_fkey';

-- 2) Sample existing requester ids (successful past inserts use auth user ids)
SELECT id, title, requester_id, created_at
FROM it_requests
ORDER BY created_at DESC
LIMIT 5;

-- 3) Expected: requester_id = auth.users.id and RLS auth.uid() = requester_id
-- If step 1 shows REFERENCES users(id) but step 2 stores auth uids, fix the FK:

ALTER TABLE it_requests DROP CONSTRAINT IF EXISTS it_requests_requester_id_fkey;

ALTER TABLE it_requests
  ADD CONSTRAINT it_requests_requester_id_fkey
  FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4) Ensure insert RLS matches (requester must be logged-in user)
DROP POLICY IF EXISTS "Users can create requests" ON it_requests;
CREATE POLICY "Users can create requests" ON it_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can view own requests" ON it_requests;
CREATE POLICY "Users can view own requests" ON it_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id);

-- 5) Optional: view requester email via users table (display only)
-- requester_id holds auth uid; join users on auth_user_id
-- SELECT r.*, u.email FROM it_requests r
-- LEFT JOIN users u ON u.auth_user_id = r.requester_id;

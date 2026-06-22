-- ============================================================
-- Fix: "it_requests_requester_id_fkey" when other users submit
--
-- Cause: requester_id must be the logged-in Supabase Auth user id
-- (auth.users.id / auth.uid()). If the FK still points at
-- public.users(id), inserts fail for anyone whose auth uid is not
-- also their users.id row (admins often work by coincidence).
--
-- Run this entire script in the Supabase SQL Editor.
-- ============================================================

-- 1) Inspect current FK (run first if you want to see the problem)
SELECT
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'it_requests'
  AND c.conname = 'it_requests_requester_id_fkey';

-- 2) Point requester_id at auth.users (correct for auth.uid() = requester_id)
ALTER TABLE public.it_requests DROP CONSTRAINT IF EXISTS it_requests_requester_id_fkey;

ALTER TABLE public.it_requests
  ADD CONSTRAINT it_requests_requester_id_fkey
  FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3) Ensure every auth account has a UHub users row (display / roles / notifications)
INSERT INTO public.users (auth_user_id, email, role, status)
SELECT au.id, au.email, 'employee', 'active'
FROM auth.users au
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = au.id
  );

-- 4) Link users.auth_user_id where email matches but link is missing
UPDATE public.users u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.auth_user_id IS NULL
  AND lower(trim(u.email)) = lower(trim(au.email));

-- 5) Insert policy: requester must be the logged-in user
DROP POLICY IF EXISTS "requests_insert_users" ON public.it_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.it_requests;

CREATE POLICY "it_requests_insert_own"
ON public.it_requests
FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

-- 6) Verify
SELECT
  'Setup complete' AS status,
  pg_get_constraintdef(oid) AS requester_fk
FROM pg_constraint
WHERE conname = 'it_requests_requester_id_fkey';

SELECT COUNT(*) AS users_missing_auth_link
FROM public.users
WHERE auth_user_id IS NULL AND email IS NOT NULL;

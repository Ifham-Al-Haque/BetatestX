-- IT Request access model (UHub product concept)
--
-- 1. Any logged-in UHub user (auth.users) can CREATE a request with requester_id = auth.uid()
-- 2. Regular users SELECT/UPDATE only their own rows (requester_id = auth.uid())
-- 3. Admin + IT staff (users.role) SELECT/UPDATE all rows for assignment & resolution
--    Admin/super_admin: full access to entire queue (same as IT resolver roles, plus all other UHub features)
--
-- requester_id references auth.users(id), NOT public.users.id or employees.id.
-- Display name/email: join public.users ON users.auth_user_id = it_requests.requester_id

-- Verify FK target (run in Supabase SQL editor):
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.it_requests'::regclass AND contype = 'f'
--   AND conname LIKE '%requester%';

-- If requester_id FK is NOT auth.users(id), run fix_it_requests_requester_fk.sql first.

-- Example RLS (adjust if your policies differ):
/*
CREATE POLICY "it_requests_insert_own" ON public.it_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "it_requests_select_own" ON public.it_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "it_requests_select_it_staff" ON public.it_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND lower(u.role) IN (
          'admin', 'super_admin', 'it_management', 'it_manager', 'it_technician', 'it'
        )
    )
  );

CREATE POLICY "it_requests_update_it_staff" ON public.it_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND lower(u.role) IN (
          'admin', 'super_admin', 'it_management', 'it_manager', 'it_technician', 'it'
        )
    )
  );
*/

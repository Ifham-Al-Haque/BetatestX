-- ============================================================
-- IT Requests SELECT privacy: own tickets vs admin / IT queue
--
-- Replaces open policy "requests_select_all" (any user saw every ticket).
--
-- After this script:
--   • Every user SELECTs rows where requester_id = auth.uid()
--   • admin / super_admin SELECT all rows
--   • IT resolver roles SELECT all rows (Request Inbox assignment)
--
-- IT Requests page (/it-requests) still filters to own tickets in the
-- app for IT staff; only admin sees all on that page.
-- ============================================================

ALTER TABLE public.it_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_all" ON public.it_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.it_requests;
DROP POLICY IF EXISTS "it_requests_select_own" ON public.it_requests;
DROP POLICY IF EXISTS "it_requests_select_admin" ON public.it_requests;
DROP POLICY IF EXISTS "it_requests_select_it_queue" ON public.it_requests;

-- Own tickets (every authenticated UHub user)
CREATE POLICY "it_requests_select_own"
ON public.it_requests
FOR SELECT
TO authenticated
USING (requester_id = auth.uid());

-- Admin — full visibility
CREATE POLICY "it_requests_select_admin"
ON public.it_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND lower(u.role::text) IN ('admin', 'super_admin')
  )
);

-- IT staff — queue / Request Inbox (assign & resolve any ticket)
CREATE POLICY "it_requests_select_it_queue"
ON public.it_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND lower(u.role::text) IN (
        'it_management', 'it_manager', 'it_technician', 'it'
      )
  )
);

-- Verify (expect 3 SELECT policies; no requests_select_all)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'it_requests' AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================
-- Allow requesters to close their own RESOLVED tickets
-- Run this in the Supabase SQL Editor.
--
-- Flow: IT resolves ticket -> requester sees it in "Resolved"
-- section -> requester clicks "Confirm & Close" -> status
-- becomes 'closed' -> ticket appears in "Request Archive".
-- ============================================================

-- Requester (UHub user, auth.uid() = requester_id) may update
-- their own request ONLY when it is currently 'resolved',
-- and only into the 'closed' state.
DROP POLICY IF EXISTS "it_requests_requester_close" ON public.it_requests;

CREATE POLICY "it_requests_requester_close"
ON public.it_requests
FOR UPDATE
TO authenticated
USING (
  requester_id = auth.uid()
  AND status = 'resolved'
)
WITH CHECK (
  requester_id = auth.uid()
  AND status = 'closed'
);

-- ============================================================
-- Admins (full access) and IT staff may also close/update any
-- ticket, including closing a resolved ticket on behalf of the
-- requester. Role is read from the UHub `users` table
-- (linked to the logged-in account via auth_user_id).
-- ============================================================
DROP POLICY IF EXISTS "it_requests_admin_staff_update" ON public.it_requests;

CREATE POLICY "it_requests_admin_staff_update"
ON public.it_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'it_management', 'it_manager', 'it_technician', 'it')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'it_management', 'it_manager', 'it_technician', 'it')
  )
);

-- Verify
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'it_requests'
ORDER BY policyname;

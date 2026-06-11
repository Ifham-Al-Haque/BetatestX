-- ============================================================
-- IT Requests: Subtasks + real SLA tracking
-- Run in the Supabase SQL Editor.
--
-- 1. Adds sla_due_at / sla_paused_at to it_requests
-- 2. Backfills SLA due dates from priority sla_hours
-- 3. Trigger: sets SLA on insert, recomputes on priority change,
--    pauses the clock while status = 'pending_user'
-- 4. Creates it_request_subtasks (checklist inside a ticket)
-- 5. Recreates it_requests_with_details so the view exposes
--    the new SLA columns
-- ============================================================

-- ---------- 1. SLA columns ----------
ALTER TABLE public.it_requests ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE public.it_requests ADD COLUMN IF NOT EXISTS sla_paused_at TIMESTAMPTZ;

-- ---------- 2. Backfill ----------
UPDATE public.it_requests r
SET sla_due_at = r.created_at + make_interval(hours => COALESCE(p.sla_hours, 72))
FROM public.it_request_priorities p
WHERE r.priority_id = p.id
  AND r.sla_due_at IS NULL;

UPDATE public.it_requests
SET sla_due_at = created_at + INTERVAL '72 hours'
WHERE sla_due_at IS NULL;

-- ---------- 3. SLA maintenance trigger ----------
CREATE OR REPLACE FUNCTION public.it_requests_sla_maintenance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_hours integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.sla_due_at IS NULL THEN
      SELECT sla_hours INTO v_hours FROM public.it_request_priorities WHERE id = NEW.priority_id;
      NEW.sla_due_at := COALESCE(NEW.created_at, now()) + make_interval(hours => COALESCE(v_hours, 72));
    END IF;
    RETURN NEW;
  END IF;

  -- Priority changed on an open ticket -> recompute SLA from policy
  IF NEW.priority_id IS DISTINCT FROM OLD.priority_id
     AND NEW.status NOT IN ('resolved', 'closed', 'cancelled') THEN
    SELECT sla_hours INTO v_hours FROM public.it_request_priorities WHERE id = NEW.priority_id;
    NEW.sla_due_at := NEW.created_at + make_interval(hours => COALESCE(v_hours, 72));
  END IF;

  -- Pause the SLA clock while waiting on the requester
  IF NEW.status = 'pending_user' AND OLD.status IS DISTINCT FROM 'pending_user' THEN
    NEW.sla_paused_at := now();
  ELSIF OLD.status = 'pending_user'
        AND NEW.status IS DISTINCT FROM 'pending_user'
        AND OLD.sla_paused_at IS NOT NULL THEN
    -- Extend the due date by however long we waited on the user
    NEW.sla_due_at := COALESCE(NEW.sla_due_at, OLD.sla_due_at) + (now() - OLD.sla_paused_at);
    NEW.sla_paused_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_it_requests_sla ON public.it_requests;
CREATE TRIGGER trg_it_requests_sla
BEFORE INSERT OR UPDATE ON public.it_requests
FOR EACH ROW EXECUTE FUNCTION public.it_requests_sla_maintenance();

-- ---------- 4. Subtasks (checklist) ----------
CREATE TABLE IF NOT EXISTS public.it_request_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.it_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  done_by UUID,            -- auth uid of the UHub user who checked it off
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,         -- auth uid of the UHub user who added it
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_request_subtasks_request
  ON public.it_request_subtasks(request_id);

ALTER TABLE public.it_request_subtasks ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated UHub user (mirrors the open read on it_requests)
DROP POLICY IF EXISTS "subtasks_select_authenticated" ON public.it_request_subtasks;
CREATE POLICY "subtasks_select_authenticated"
ON public.it_request_subtasks
FOR SELECT TO authenticated
USING (true);

-- Write: admins + IT staff only (role from UHub users table)
DROP POLICY IF EXISTS "subtasks_write_admin_it" ON public.it_request_subtasks;
CREATE POLICY "subtasks_write_admin_it"
ON public.it_request_subtasks
FOR ALL TO authenticated
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

-- ---------- 5. Recreate the details view (now includes SLA cols) ----------
DROP VIEW IF EXISTS public.it_requests_with_details;

CREATE VIEW public.it_requests_with_details AS
SELECT
    r.*,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon,
    p.name AS priority_name,
    p.level AS priority_level,
    p.color AS priority_color,
    p.sla_hours,
    req_u.full_name AS requester_name,
    req_u.email AS requester_email,
    req_u.role AS requester_role,
    req_u.department AS requester_department,
    assignee_u.full_name AS assigned_to_name,
    assignee_u.email AS assigned_to_email
FROM public.it_requests r
LEFT JOIN public.it_request_categories c ON r.category_id = c.id
LEFT JOIN public.it_request_priorities p ON r.priority_id = p.id
LEFT JOIN public.users req_u ON req_u.auth_user_id = r.requester_id OR req_u.id = r.requester_id
LEFT JOIN public.users assignee_u ON assignee_u.id = r.assigned_to;

GRANT SELECT ON public.it_requests_with_details TO authenticated;

-- ---------- Verify ----------
SELECT
  'Setup complete' AS status,
  (SELECT COUNT(*) FROM public.it_requests WHERE sla_due_at IS NOT NULL) AS tickets_with_sla,
  (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'it_request_subtasks') AS subtasks_table_exists;

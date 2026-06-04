-- =============================================================================
-- UHub Operation — Team Allocation Board schema
-- =============================================================================
-- Powers /operation/team-allocation (drag-and-drop driver → team board + Excel export).
-- Safe to re-run (idempotent). Run in Supabase SQL Editor on the UHub project.
--
-- Builds on PART D of operation_revamp_verify_and_migrate.sql. If you already ran
-- PART D, this only ADDS the extra columns the allocation board needs.
-- =============================================================================

-- 1) Base tables (no-op if PART D already created them) -----------------------
CREATE TABLE IF NOT EXISTS public.operation_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  team_type VARCHAR(50),
  lead_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id)
);

CREATE TABLE IF NOT EXISTS public.operation_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.operation_teams(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at DATE DEFAULT CURRENT_DATE,
  left_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, driver_id)
);

-- 2) Allocation-board columns -------------------------------------------------
ALTER TABLE public.operation_teams
  ADD COLUMN IF NOT EXISTS shift_label   VARCHAR(60),   -- e.g. "7 AM - 5 PM"
  ADD COLUMN IF NOT EXISTS week_off      VARCHAR(20),   -- e.g. "Monday"
  ADD COLUMN IF NOT EXISTS area          VARCHAR(150),  -- e.g. "Marina To Business Bay"
  ADD COLUMN IF NOT EXISTS color         VARCHAR(20) DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE public.operation_team_members
  ADD COLUMN IF NOT EXISTS member_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (member_status IN ('active', 'annual_leave', 'sick_leave', 'off')),
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- A driver can only sit in ONE team on the allocation board.
-- (Enforced in the app; we also help with a partial unique index on active rows.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_member_per_driver
  ON public.operation_team_members(driver_id)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_operation_team_members_team ON public.operation_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_operation_team_members_driver ON public.operation_team_members(driver_id);
CREATE INDEX IF NOT EXISTS idx_operation_teams_display_order ON public.operation_teams(display_order);

-- 3) RLS (authenticated full access — tighten by role later) ------------------
ALTER TABLE public.operation_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operation_teams_authenticated ON public.operation_teams;
CREATE POLICY operation_teams_authenticated ON public.operation_teams
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS operation_team_members_authenticated ON public.operation_team_members;
CREATE POLICY operation_team_members_authenticated ON public.operation_team_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_team_members TO authenticated;

-- 4) Verify -------------------------------------------------------------------
SELECT 'operation_teams columns' AS check_group, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'operation_teams'
  AND column_name IN ('shift_label', 'week_off', 'area', 'color', 'display_order')
ORDER BY column_name;

SELECT 'operation_team_members columns' AS check_group, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'operation_team_members'
  AND column_name IN ('member_status', 'display_order', 'role', 'is_active')
ORDER BY column_name;

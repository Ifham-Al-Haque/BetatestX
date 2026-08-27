-- HR department + branch catalog for Employee Form.
-- Run in the UHub Supabase SQL editor (project qtugowosurgecytgswuo).
-- Safe to re-run.
--
-- Uses org_departments / org_department_branches on purpose.
-- public.departments already exists for fleet/subscribe-now and must not be reused.
--
-- This does NOT rewrite employees.department or employees.sub_department.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.org_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  aliases text[] NOT NULL DEFAULT '{}',
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_department_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.org_departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, code)
);

CREATE INDEX IF NOT EXISTS idx_org_department_branches_department_id
  ON public.org_department_branches (department_id);

COMMENT ON TABLE public.org_departments IS
  'HR-managed parent departments for employee records, filters, and org chart.';
COMMENT ON TABLE public.org_department_branches IS
  'HR-managed teams/branches under a parent department.';

CREATE OR REPLACE FUNCTION public.set_org_department_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_departments_updated_at ON public.org_departments;
CREATE TRIGGER trg_org_departments_updated_at
  BEFORE UPDATE ON public.org_departments
  FOR EACH ROW EXECUTE PROCEDURE public.set_org_department_updated_at();

DROP TRIGGER IF EXISTS trg_org_department_branches_updated_at ON public.org_department_branches;
CREATE TRIGGER trg_org_department_branches_updated_at
  BEFORE UPDATE ON public.org_department_branches
  FOR EACH ROW EXECUTE PROCEDURE public.set_org_department_updated_at();

CREATE OR REPLACE FUNCTION public.normalize_org_label(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(regexp_replace(btrim(coalesce(value, '')), '[^a-zA-Z0-9]+', '_', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.is_department_catalog_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('admin', 'hr_manager', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_department_catalog_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_department_catalog_manager() TO authenticated;

ALTER TABLE public.org_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_department_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read org departments" ON public.org_departments;
CREATE POLICY "Authenticated users can read org departments"
  ON public.org_departments FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "HR can insert org departments" ON public.org_departments;
CREATE POLICY "HR can insert org departments"
  ON public.org_departments FOR INSERT TO authenticated
  WITH CHECK (public.is_department_catalog_manager());

DROP POLICY IF EXISTS "HR can update org departments" ON public.org_departments;
CREATE POLICY "HR can update org departments"
  ON public.org_departments FOR UPDATE TO authenticated
  USING (public.is_department_catalog_manager())
  WITH CHECK (public.is_department_catalog_manager());

DROP POLICY IF EXISTS "HR can delete org departments" ON public.org_departments;
CREATE POLICY "HR can delete org departments"
  ON public.org_departments FOR DELETE TO authenticated
  USING (public.is_department_catalog_manager());

DROP POLICY IF EXISTS "Authenticated users can read org department branches" ON public.org_department_branches;
CREATE POLICY "Authenticated users can read org department branches"
  ON public.org_department_branches FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "HR can insert org department branches" ON public.org_department_branches;
CREATE POLICY "HR can insert org department branches"
  ON public.org_department_branches FOR INSERT TO authenticated
  WITH CHECK (public.is_department_catalog_manager());

DROP POLICY IF EXISTS "HR can update org department branches" ON public.org_department_branches;
CREATE POLICY "HR can update org department branches"
  ON public.org_department_branches FOR UPDATE TO authenticated
  USING (public.is_department_catalog_manager())
  WITH CHECK (public.is_department_catalog_manager());

DROP POLICY IF EXISTS "HR can delete org department branches" ON public.org_department_branches;
CREATE POLICY "HR can delete org department branches"
  ON public.org_department_branches FOR DELETE TO authenticated
  USING (public.is_department_catalog_manager());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_department_branches TO authenticated;

INSERT INTO public.org_departments (name, code, aliases, color, sort_order)
VALUES
  ('Technology', 'TECHNOLOGY', ARRAY['TECHNOLOGY','TECH','IT','INFORMATION TECHNOLOGY'], 'blue', 10),
  ('Operations', 'OPERATIONS', ARRAY['OPERATIONS','OPS','DRIVER MANAGEMENT','FLEET'], 'orange', 20),
  ('Finance', 'FINANCE', ARRAY['FINANCE','ACCOUNTING','ACCOUNTS'], 'emerald', 30),
  ('Human Resources', 'HR', ARRAY['HR','HUMAN RESOURCES'], 'pink', 40),
  ('Marketing', 'MARKETING', ARRAY['MARKETING'], 'purple', 50),
  ('Sales', 'SALES', ARRAY['SALES','SUBSCRIBE NOW SALES','SUBSCRIBE_NOW_SALES','SUBSCRIBE NOW'], 'rose', 60),
  ('Customer Service', 'CUSTOMER_SERVICE', ARRAY['CUSTOMER SERVICE','CUSTOMER_SERVICE','SUPPORT','CS'], 'cyan', 70),
  ('Collection', 'COLLECTION', ARRAY['COLLECTION','COLLECTIONS'], 'amber', 80),
  ('Management', 'MANAGEMENT', ARRAY['MANAGEMENT','MANAGMENT','EXECUTIVE'], 'slate', 90),
  ('Others', 'OTHERS', ARRAY['OTHERS','OTHER'], 'gray', 100)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.org_department_branches (department_id, name, code, aliases, sort_order)
SELECT d.id, v.name, v.code, v.aliases, v.sort_order
FROM public.org_departments d
JOIN (
  VALUES
    ('TECHNOLOGY', 'Product', 'PRODUCT', ARRAY['PRODUCT','PRODUCT MANAGEMENT','PM'], 10),
    ('TECHNOLOGY', 'IT', 'IT', ARRAY['IT','TECHNOLOGY','TECH','INFORMATION TECHNOLOGY'], 20),
    ('TECHNOLOGY', 'IoT', 'IOT', ARRAY['IOT','IOT MANAGEMENT','INTERNET OF THINGS'], 30),
    ('TECHNOLOGY', 'Data Analytics & Business Intelligence', 'DATA_BI', ARRAY['DATA ANALYTIC','DATA ANALYTICS','BUSINESS INTELLIGENCE','BI','DATA SCIENCE','ANALYTICS'], 40),
    ('OPERATIONS', 'Fleet', 'FLEET', ARRAY['FLEET','FLEET MANAGEMENT'], 10),
    ('OPERATIONS', 'Driver Management', 'DRIVER', ARRAY['DRIVER MANAGEMENT','DRIVERS'], 20),
    ('OPERATIONS', 'Operations', 'OPS_GENERAL', ARRAY['OPERATIONS','OPS'], 30),
    ('FINANCE', 'Finance', 'FINANCE', ARRAY['FINANCE','ACCOUNTING','ACCOUNTS'], 10),
    ('HR', 'HR', 'HR', ARRAY['HR','HUMAN RESOURCES'], 10),
    ('MARKETING', 'Marketing', 'MARKETING', ARRAY['MARKETING'], 10),
    ('SALES', 'Subscribe Now Sales', 'SUBSCRIBE_NOW', ARRAY['SUBSCRIBE NOW SALES','SUBSCRIBE NOW','SUBSCRIBE_NOW_SALES'], 10),
    ('SALES', 'Sales', 'SALES', ARRAY['SALES'], 20),
    ('CUSTOMER_SERVICE', 'Customer Service', 'CS', ARRAY['CUSTOMER SERVICE','CUSTOMER_SERVICE','SUPPORT'], 10),
    ('COLLECTION', 'Collection', 'COLLECTION', ARRAY['COLLECTION','COLLECTIONS'], 10),
    ('MANAGEMENT', 'Executive', 'EXEC', ARRAY['MANAGEMENT','EXECUTIVE'], 10),
    ('OTHERS', 'General', 'GENERAL', ARRAY['OTHERS','GENERAL'], 10)
) AS v(parent_code, name, code, aliases, sort_order)
  ON d.code = v.parent_code
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO public.org_departments (name, code, aliases, sort_order)
SELECT
  btrim(e.department) AS name,
  public.normalize_org_label(e.department) AS code,
  ARRAY[btrim(e.department)] AS aliases,
  200 AS sort_order
FROM public.employees e
WHERE e.department IS NOT NULL
  AND btrim(e.department) <> ''
  AND public.normalize_org_label(e.department) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.org_departments d
    WHERE public.normalize_org_label(d.code) = public.normalize_org_label(e.department)
       OR public.normalize_org_label(d.name) = public.normalize_org_label(e.department)
       OR public.normalize_org_label(e.department) = ANY (
            SELECT public.normalize_org_label(a) FROM unnest(d.aliases) a
          )
  )
GROUP BY btrim(e.department), public.normalize_org_label(e.department)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.org_department_branches (department_id, name, code, aliases, sort_order)
SELECT
  d.id,
  btrim(e.sub_department),
  public.normalize_org_label(e.sub_department),
  ARRAY[btrim(e.sub_department)],
  200
FROM public.employees e
JOIN public.org_departments d
  ON public.normalize_org_label(e.department) = public.normalize_org_label(d.code)
  OR public.normalize_org_label(e.department) = public.normalize_org_label(d.name)
  OR public.normalize_org_label(e.department) = ANY (
       SELECT public.normalize_org_label(a) FROM unnest(d.aliases) a
     )
WHERE e.sub_department IS NOT NULL
  AND btrim(e.sub_department) <> ''
  AND public.normalize_org_label(e.sub_department) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.org_department_branches b
    WHERE b.department_id = d.id
      AND (
        public.normalize_org_label(b.code) = public.normalize_org_label(e.sub_department)
        OR public.normalize_org_label(b.name) = public.normalize_org_label(e.sub_department)
        OR public.normalize_org_label(e.sub_department) = ANY (
             SELECT public.normalize_org_label(a) FROM unnest(b.aliases) a
           )
      )
  )
GROUP BY d.id, btrim(e.sub_department), public.normalize_org_label(e.sub_department)
ON CONFLICT (department_id, code) DO NOTHING;

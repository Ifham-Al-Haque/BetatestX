-- Payroll calculation formulas (lockable, versioned).
-- Each "Lock & Apply" in the Payroll Calculator inserts a NEW row,
-- so the full history of formulas is preserved. The newest row is the
-- active formula set.
-- Run this in the Supabase SQL editor.

create table if not exists public.payroll_formulas (
  id uuid primary key default gen_random_uuid(),

  gross_formula text not null,
  tax_formula text not null,
  net_formula text not null,

  is_locked boolean not null default true,
  locked_at timestamptz not null default now(),
  locked_by uuid,
  locked_by_name text,

  created_at timestamptz not null default now()
);

create index if not exists payroll_formulas_created_at_idx
  on public.payroll_formulas (created_at desc);

-- Enable RLS. Apply staff-only policies by running restrict_payroll_rls.sql.
alter table public.payroll_formulas enable row level security;

-- Seed the default formula set (matches the previous hardcoded calculation)
insert into public.payroll_formulas (gross_formula, tax_formula, net_formula, locked_by_name)
select
  'basic_salary + allowances + bonus + overtime',
  'gross * tax_rate / 100',
  'gross - deductions - tax',
  'System default'
where not exists (select 1 from public.payroll_formulas);

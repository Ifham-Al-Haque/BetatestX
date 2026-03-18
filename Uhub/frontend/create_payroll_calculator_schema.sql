-- Payroll Calculator schema (batches + rows)
-- Run this in Supabase SQL editor.

create table if not exists public.payroll_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  month text not null,
  year int not null,

  row_count int not null default 0,
  totals jsonb not null default '{}'::jsonb,

  is_locked boolean not null default false,
  locked_at timestamptz,
  locked_by uuid,
  locked_by_name text,

  created_at timestamptz not null default now(),
  created_by uuid not null,
  created_by_name text
);

-- Enforce one batch per month/year (month-year locking)
create unique index if not exists payroll_batches_month_year_unique
  on public.payroll_batches (month, year);

create table if not exists public.payroll_batch_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.payroll_batches(id) on delete cascade,

  employee_id text,
  full_name text,
  department text,
  month text,
  year int,

  basic_salary numeric not null default 0,
  allowances numeric not null default 0,
  deductions numeric not null default 0,
  overtime_hours numeric not null default 0,
  overtime_rate numeric not null default 0,
  overtime_amount numeric not null default 0,
  bonus numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  gross_salary numeric not null default 0,
  net_salary numeric not null default 0,

  raw jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists payroll_batch_rows_batch_id_idx
  on public.payroll_batch_rows (batch_id);

-- RLS (basic, adjust as needed)
alter table public.payroll_batches enable row level security;
alter table public.payroll_batch_rows enable row level security;

-- Allow authenticated users to read/write (tighten to HR roles if desired)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payroll_batches' and policyname = 'payroll_batches_auth_all'
  ) then
    create policy payroll_batches_auth_all
      on public.payroll_batches
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payroll_batch_rows' and policyname = 'payroll_batch_rows_auth_all'
  ) then
    create policy payroll_batch_rows_auth_all
      on public.payroll_batch_rows
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;


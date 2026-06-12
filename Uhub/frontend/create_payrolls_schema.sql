-- Payroll records table for the Payroll Management page (src/pages/Payroll.jsx)
-- Run this in the Supabase SQL editor.

create table if not exists public.payrolls (
  id uuid primary key default gen_random_uuid(),

  -- UDrive employee this payroll belongs to (employees.id, stored as text
  -- to match the existing payroll_batch_rows pattern)
  employee_id text not null,
  employee_name text,
  department text,

  month text not null,
  year int not null,

  basic_salary numeric not null default 0,
  allowances numeric not null default 0,
  deductions numeric not null default 0,
  overtime_hours numeric not null default 0,
  overtime_rate numeric not null default 0,
  bonus numeric not null default 0,
  gross_salary numeric not null default 0,
  net_salary numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,

  batch_id uuid,

  status text not null default 'pending', -- pending | processed | cancelled
  processed_date timestamptz,
  processed_by text,

  notes text,

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One payroll record per employee per month/year
create unique index if not exists payrolls_employee_month_year_unique
  on public.payrolls (employee_id, month, year);

create index if not exists payrolls_batch_id_idx on public.payrolls (batch_id);

create index if not exists payrolls_month_year_idx
  on public.payrolls (year, month);

-- RLS (basic, tighten to HR/admin roles if desired)
alter table public.payrolls enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payrolls' and policyname = 'payrolls_auth_all'
  ) then
    create policy payrolls_auth_all
      on public.payrolls
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

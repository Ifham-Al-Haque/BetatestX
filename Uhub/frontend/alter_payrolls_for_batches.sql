-- Enhance payrolls + batches for merged Payroll workflow (publish batch → records)
-- Run in Supabase SQL editor after create_payrolls_schema.sql and create_payroll_calculator_schema.sql

alter table public.payrolls
  add column if not exists batch_id uuid references public.payroll_batches(id) on delete set null,
  add column if not exists tax_rate numeric not null default 0,
  add column if not exists tax_amount numeric not null default 0;

create index if not exists payrolls_batch_id_idx on public.payrolls (batch_id);

alter table public.payroll_batches
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid,
  add column if not exists published_by_name text;

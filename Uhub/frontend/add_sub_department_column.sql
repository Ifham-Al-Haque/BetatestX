-- Add sub_department (team/branch) to employees for accurate org hierarchy branch mapping.
-- Run in Supabase SQL editor before using the branch field in Employee Form.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS sub_department TEXT;

COMMENT ON COLUMN employees.sub_department IS
  'Team or branch within a parent department (e.g. Product, IT, IoT, Data Analytics & BI under Technology).';

CREATE INDEX IF NOT EXISTS idx_employees_sub_department ON employees (sub_department);

-- Add Finance Viewer role to users table role check constraint

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check
CHECK (role IN (
    'admin',
    'data_operator',
    'finance',
    'finance_viewer',
    'it_management',
    'iot_management',
    'manager',
    'driver_management',
    'operation_management',
    'hr_manager',
    'cs_manager',
    'collections',
    'marketing_manager',
    'marketing_specialist',
    'marketing_management',
    'subscribe_now',
    'employee',
    'viewer'
));

SELECT
    'Constraint Update Status' AS info,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check'
  AND conrelid = 'public.users'::regclass;

SELECT 'Finance Viewer role is now allowed on public.users.role.' AS status;

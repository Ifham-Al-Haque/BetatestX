-- Fix RLS Policy for Inserting Fleet Maintenance Records
-- This allows any authenticated user linked to an employee to create maintenance records

-- Drop existing insert policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Managers can insert maintenance records" ON fleet_maintenance;
DROP POLICY IF EXISTS "Users can insert maintenance records" ON fleet_maintenance;

-- Policy: Any authenticated user linked to an employee can create maintenance records
-- This allows ticket conversion and manual record creation to work
CREATE POLICY "Users can insert maintenance records" ON fleet_maintenance
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND u.employee_id IS NOT NULL
        )
    );

-- Grant INSERT permission (if not already granted)
GRANT INSERT ON fleet_maintenance TO authenticated;


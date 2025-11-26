-- Fix RLS Policy for Deleting Fleet Maintenance Records
-- This allows users to delete maintenance records they created, or admins/managers to delete any record

-- Drop existing delete policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete maintenance records" ON fleet_maintenance;
DROP POLICY IF EXISTS "Managers can delete maintenance records" ON fleet_maintenance;

-- Policy: Users can delete maintenance records they created, or admins/managers can delete any record
CREATE POLICY "Users can delete maintenance records" ON fleet_maintenance
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (
            -- User created the record (via users -> employees relationship)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND u.employee_id = fleet_maintenance.created_by
            )
            OR
            -- Admin or Manager (from users table)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.role IN ('admin', 'manager', 'fleet_manager')
            )
        )
    );

-- Grant DELETE permission (if not already granted)
GRANT DELETE ON fleet_maintenance TO authenticated;


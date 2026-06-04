-- Fix fleet_vehicles RLS — original policies used employees.id = auth.uid() which never matches.
-- auth.uid() is the Supabase Auth user id; check public.users.auth_user_id instead.

DROP POLICY IF EXISTS "Managers can delete fleet vehicles" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Managers can insert fleet vehicles" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Managers can update fleet vehicles" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Authenticated can manage fleet vehicles" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Authenticated can insert fleet vehicles" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Authenticated can update fleet vehicles" ON public.fleet_vehicles;
DROP POLICY IF EXISTS "Authenticated can delete fleet vehicles" ON public.fleet_vehicles;

CREATE POLICY "Authenticated can insert fleet vehicles" ON public.fleet_vehicles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('admin', 'manager', 'fleet_manager', 'operation_manager')
    )
  );

CREATE POLICY "Authenticated can update fleet vehicles" ON public.fleet_vehicles
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('admin', 'manager', 'fleet_manager', 'operation_manager')
    )
  );

CREATE POLICY "Authenticated can delete fleet vehicles" ON public.fleet_vehicles
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('admin', 'manager', 'fleet_manager', 'operation_manager')
    )
  );

GRANT DELETE ON public.fleet_vehicles TO authenticated;

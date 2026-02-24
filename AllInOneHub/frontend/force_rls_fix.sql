-- Force RLS Fix - More Aggressive Approach
-- Run this in your Supabase SQL Editor

-- 1. First, let's disable RLS temporarily to see if that's the issue
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_request DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_items DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to modify employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to read expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated users to modify expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated users to read assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated users to modify assets" ON assets;
DROP POLICY IF EXISTS "Allow authenticated users to read payment_events" ON payment_events;
DROP POLICY IF EXISTS "Allow authenticated users to modify payment_events" ON payment_events;
DROP POLICY IF EXISTS "Allow authenticated users to read payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated users to modify payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated users to read tickets" ON tickets;
DROP POLICY IF EXISTS "Allow authenticated users to modify tickets" ON tickets;
DROP POLICY IF EXISTS "Allow authenticated users to read access_request" ON access_request;
DROP POLICY IF EXISTS "Allow authenticated users to modify access_request" ON access_request;
DROP POLICY IF EXISTS "Allow authenticated users to read employee_access" ON employee_access;
DROP POLICY IF EXISTS "Allow authenticated users to modify employee_access" ON employee_access;
DROP POLICY IF EXISTS "Allow authenticated users to read activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow authenticated users to modify activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow authenticated users to read access_items" ON access_items;
DROP POLICY IF EXISTS "Allow authenticated users to modify access_items" ON access_items;

-- 3. Re-enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_items ENABLE ROW LEVEL SECURITY;

-- 4. Create very permissive policies for testing
-- Employees table
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE TO authenticated USING (true);

-- Expenses table
CREATE POLICY "expenses_select_policy" ON expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "expenses_insert_policy" ON expenses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "expenses_update_policy" ON expenses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "expenses_delete_policy" ON expenses
  FOR DELETE TO authenticated USING (true);

-- Assets table
CREATE POLICY "assets_select_policy" ON assets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assets_insert_policy" ON assets
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assets_update_policy" ON assets
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "assets_delete_policy" ON assets
  FOR DELETE TO authenticated USING (true);

-- Payment Events table
CREATE POLICY "payment_events_select_policy" ON payment_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payment_events_insert_policy" ON payment_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "payment_events_update_policy" ON payment_events
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "payment_events_delete_policy" ON payment_events
  FOR DELETE TO authenticated USING (true);

-- Payments table
CREATE POLICY "payments_select_policy" ON payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payments_insert_policy" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "payments_update_policy" ON payments
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "payments_delete_policy" ON payments
  FOR DELETE TO authenticated USING (true);

-- Tickets table
CREATE POLICY "tickets_select_policy" ON tickets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tickets_insert_policy" ON tickets
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tickets_update_policy" ON tickets
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tickets_delete_policy" ON tickets
  FOR DELETE TO authenticated USING (true);

-- Access Request table
CREATE POLICY "access_request_select_policy" ON access_request
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "access_request_insert_policy" ON access_request
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "access_request_update_policy" ON access_request
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "access_request_delete_policy" ON access_request
  FOR DELETE TO authenticated USING (true);

-- Employee Access table
CREATE POLICY "employee_access_select_policy" ON employee_access
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "employee_access_insert_policy" ON employee_access
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "employee_access_update_policy" ON employee_access
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "employee_access_delete_policy" ON employee_access
  FOR DELETE TO authenticated USING (true);

-- Activity Logs table
CREATE POLICY "activity_logs_select_policy" ON activity_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "activity_logs_insert_policy" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "activity_logs_update_policy" ON activity_logs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "activity_logs_delete_policy" ON activity_logs
  FOR DELETE TO authenticated USING (true);

-- Access Items table
CREATE POLICY "access_items_select_policy" ON access_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "access_items_insert_policy" ON access_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "access_items_update_policy" ON access_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "access_items_delete_policy" ON access_items
  FOR DELETE TO authenticated USING (true);

-- 5. Test the policies
SELECT 'RLS Fix Complete' as status; 
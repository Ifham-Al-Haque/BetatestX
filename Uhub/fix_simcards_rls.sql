-- Fix RLS Policies for SIM Cards Table
-- This will allow proper CRUD operations

-- First, let's drop the existing policies
DROP POLICY IF EXISTS "Users can view all SIM cards" ON sim_cards;
DROP POLICY IF EXISTS "Users can insert SIM cards" ON sim_cards;
DROP POLICY IF EXISTS "Users can update SIM cards" ON sim_cards;
DROP POLICY IF EXISTS "Users can delete SIM cards" ON sim_cards;

-- Create new, more permissive policies for development
-- You can adjust these based on your security requirements

-- Policy for users to view all SIM cards
CREATE POLICY "Users can view all SIM cards" ON sim_cards
    FOR SELECT USING (true);

-- Policy for authenticated users to insert SIM cards
CREATE POLICY "Authenticated users can insert SIM cards" ON sim_cards
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update SIM cards
CREATE POLICY "Authenticated users can update SIM cards" ON sim_cards
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete SIM cards
CREATE POLICY "Authenticated users can delete SIM cards" ON sim_cards
    FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to allow all operations without authentication checks
-- (Use this for development/testing only)

-- DROP POLICY IF EXISTS "Allow all operations" ON sim_cards;
-- CREATE POLICY "Allow all operations" ON sim_cards
--     FOR ALL USING (true)
--     WITH CHECK (true);

-- Check if the table exists and has the correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sim_cards' 
ORDER BY ordinal_position;

-- Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'sim_cards';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'sim_cards';







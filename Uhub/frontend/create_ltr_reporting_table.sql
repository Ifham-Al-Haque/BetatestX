-- LTR Reporting Table Setup Script
-- Run this in your Supabase SQL Editor to create the ltr_reporting table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ltr_reporting table
CREATE TABLE IF NOT EXISTS ltr_reporting (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plate_reservation VARCHAR(255),
    title VARCHAR(255),
    amount DECIMAL(15, 2),
    period VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ltr_reporting_customer_id ON ltr_reporting(customer_id);
CREATE INDEX IF NOT EXISTS idx_ltr_reporting_name ON ltr_reporting(name);
CREATE INDEX IF NOT EXISTS idx_ltr_reporting_plate_reservation ON ltr_reporting(plate_reservation);
CREATE INDEX IF NOT EXISTS idx_ltr_reporting_start_time ON ltr_reporting(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_ltr_reporting_created_at ON ltr_reporting(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ltr_reporting ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy for SELECT: Allow authenticated users with appropriate roles
CREATE POLICY "ltr_reporting_select_policy" ON ltr_reporting
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'subscribe_now', 'cs_manager', 'operation_management', 'collections')
            )
        )
    );

-- Policy for INSERT: Allow authenticated users with appropriate roles
CREATE POLICY "ltr_reporting_insert_policy" ON ltr_reporting
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'subscribe_now', 'cs_manager', 'operation_management', 'collections')
            )
        )
    );

-- Policy for UPDATE: Allow authenticated users with appropriate roles
CREATE POLICY "ltr_reporting_update_policy" ON ltr_reporting
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'subscribe_now', 'cs_manager', 'operation_management', 'collections')
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'subscribe_now', 'cs_manager', 'operation_management', 'collections')
            )
        )
    );

-- Policy for DELETE: Allow admin, subscribe_now, cs_manager, operation_management, and collections
CREATE POLICY "ltr_reporting_delete_policy" ON ltr_reporting
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'subscribe_now', 'cs_manager', 'operation_management', 'collections')
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ltr_reporting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ltr_reporting_updated_at_trigger
    BEFORE UPDATE ON ltr_reporting
    FOR EACH ROW
    EXECUTE FUNCTION update_ltr_reporting_updated_at();

-- Grant necessary permissions
GRANT ALL ON ltr_reporting TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE ltr_reporting IS 'LTR (Long-Term Rental) reporting records with customer, plate reservation, title, amount, period, and start time information';
COMMENT ON COLUMN ltr_reporting.customer_id IS 'Customer identifier';
COMMENT ON COLUMN ltr_reporting.name IS 'Customer name';
COMMENT ON COLUMN ltr_reporting.plate_reservation IS 'Plate reservation number';
COMMENT ON COLUMN ltr_reporting.title IS 'Title/description of the LTR record';
COMMENT ON COLUMN ltr_reporting.amount IS 'Amount/value of the LTR';
COMMENT ON COLUMN ltr_reporting.period IS 'Period/duration of the LTR';
COMMENT ON COLUMN ltr_reporting.start_time IS 'Start time/date of the LTR';


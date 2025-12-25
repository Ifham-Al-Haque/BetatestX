-- IOT Records Table Setup Script
-- Run this in your Supabase SQL Editor to create the iot_records table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create iot_records table
CREATE TABLE IF NOT EXISTS iot_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id VARCHAR(255) NOT NULL,
    hardware_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    sim_number VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_iot_records_vehicle_id ON iot_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_iot_records_hardware_id ON iot_records(hardware_id);
CREATE INDEX IF NOT EXISTS idx_iot_records_sim_number ON iot_records(sim_number);
CREATE INDEX IF NOT EXISTS idx_iot_records_created_at ON iot_records(created_at DESC);

-- Enable Row Level Security
ALTER TABLE iot_records ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy for SELECT: Allow authenticated users with appropriate roles
CREATE POLICY "iot_records_select_policy" ON iot_records
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator')
            )
        )
    );

-- Policy for INSERT: Allow authenticated users with appropriate roles
CREATE POLICY "iot_records_insert_policy" ON iot_records
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator')
            )
        )
    );

-- Policy for UPDATE: Allow authenticated users with appropriate roles
CREATE POLICY "iot_records_update_policy" ON iot_records
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator')
            )
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'it_management', 'data_operator')
            )
        )
    );

-- Policy for DELETE: Allow only admin
CREATE POLICY "iot_records_delete_policy" ON iot_records
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role = 'admin'
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_iot_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_iot_records_updated_at_trigger
    BEFORE UPDATE ON iot_records
    FOR EACH ROW
    EXECUTE FUNCTION update_iot_records_updated_at();

-- Grant necessary permissions
GRANT ALL ON iot_records TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE iot_records IS 'IOT device records with vehicle, hardware, title, and SIM number information';
COMMENT ON COLUMN iot_records.vehicle_id IS 'Vehicle identifier';
COMMENT ON COLUMN iot_records.hardware_id IS 'Hardware device identifier';
COMMENT ON COLUMN iot_records.title IS 'Title/name of the IOT record';
COMMENT ON COLUMN iot_records.sim_number IS 'SIM card number associated with the device';


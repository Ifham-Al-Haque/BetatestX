-- LTR Customer Lead Table Setup Script
-- Run this in your Supabase SQL Editor to save LTR Customer Lead data to the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ltr_customer_lead table (Date, Current Trip, Trip Ended, New Trip, Renew Trip)
CREATE TABLE IF NOT EXISTS ltr_customer_lead (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE,
    current_trip INTEGER NOT NULL DEFAULT 0,
    trip_ended INTEGER NOT NULL DEFAULT 0,
    new_trip INTEGER NOT NULL DEFAULT 0,
    renew_trip INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ltr_customer_lead_date ON ltr_customer_lead(date DESC);
CREATE INDEX IF NOT EXISTS idx_ltr_customer_lead_created_at ON ltr_customer_lead(created_at DESC);

ALTER TABLE ltr_customer_lead ENABLE ROW LEVEL SECURITY;

-- RLS: same roles as ltr_reporting (admin, subscribe_now, cs_manager, operation_management, collections)
CREATE POLICY "ltr_customer_lead_select_policy" ON ltr_customer_lead
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

CREATE POLICY "ltr_customer_lead_insert_policy" ON ltr_customer_lead
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

CREATE POLICY "ltr_customer_lead_update_policy" ON ltr_customer_lead
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

CREATE POLICY "ltr_customer_lead_delete_policy" ON ltr_customer_lead
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

CREATE OR REPLACE FUNCTION update_ltr_customer_lead_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ltr_customer_lead_updated_at_trigger
    BEFORE UPDATE ON ltr_customer_lead
    FOR EACH ROW
    EXECUTE FUNCTION update_ltr_customer_lead_updated_at();

GRANT ALL ON ltr_customer_lead TO authenticated;
COMMENT ON TABLE ltr_customer_lead IS 'LTR Customer Lead: date, current_trip, trip_ended, new_trip, renew_trip';

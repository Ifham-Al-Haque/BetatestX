-- UDRIVE ACCESS Table Setup Script (IT Services Panel)
-- Run this in your Supabase SQL Editor to save UDRIVE ACCESS data to the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create udrive_access table
CREATE TABLE IF NOT EXISTS udrive_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_platform_name TEXT,
    platform_purpose TEXT,
    department_uses TEXT,
    infrastructure_level TEXT,
    original_amount NUMERIC(18, 2),
    amount_in_aed NUMERIC(18, 2),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_udrive_access_platform ON udrive_access(access_platform_name);
CREATE INDEX IF NOT EXISTS idx_udrive_access_created_at ON udrive_access(created_at DESC);

ALTER TABLE udrive_access ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users (restrict to specific roles via your users table if needed)
CREATE POLICY "udrive_access_select_policy" ON udrive_access
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "udrive_access_insert_policy" ON udrive_access
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "udrive_access_update_policy" ON udrive_access
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "udrive_access_delete_policy" ON udrive_access
    FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_udrive_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_udrive_access_updated_at_trigger ON udrive_access;
CREATE TRIGGER update_udrive_access_updated_at_trigger
    BEFORE UPDATE ON udrive_access
    FOR EACH ROW
    EXECUTE FUNCTION update_udrive_access_updated_at();

GRANT ALL ON udrive_access TO authenticated;
COMMENT ON TABLE udrive_access IS 'UDRIVE ACCESS: platform name, purpose, department, infrastructure level, amounts, remark';

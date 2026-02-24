-- LTR Customer Review Table Setup Script (Subscribe Now Panel)
-- Run this in your Supabase SQL Editor to save LTR Customer Review data to the database
-- Parameters: Customer Name, Rental Duration, Rental Renew, Rental No longer Continue, Remark

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS ltr_customer_review (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT,
    rental_duration TEXT,
    rental_renew INTEGER NOT NULL DEFAULT 0,
    rental_no_longer_continue INTEGER NOT NULL DEFAULT 0,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ltr_customer_review_customer_name ON ltr_customer_review(customer_name);
CREATE INDEX IF NOT EXISTS idx_ltr_customer_review_created_at ON ltr_customer_review(created_at DESC);

ALTER TABLE ltr_customer_review ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ltr_customer_review_select_policy" ON ltr_customer_review
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "ltr_customer_review_insert_policy" ON ltr_customer_review
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ltr_customer_review_update_policy" ON ltr_customer_review
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "ltr_customer_review_delete_policy" ON ltr_customer_review
    FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION update_ltr_customer_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ltr_customer_review_updated_at_trigger ON ltr_customer_review;
CREATE TRIGGER update_ltr_customer_review_updated_at_trigger
    BEFORE UPDATE ON ltr_customer_review
    FOR EACH ROW
    EXECUTE FUNCTION update_ltr_customer_review_updated_at();

GRANT ALL ON ltr_customer_review TO authenticated;
COMMENT ON TABLE ltr_customer_review IS 'LTR Customer Review: customer_name, rental_duration, rental_renew, rental_no_longer_continue, remark';

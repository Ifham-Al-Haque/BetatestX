-- =====================================================
-- Subscribe Now Fleet Delivery System Database Schema
-- Complete schema for Subscribe Now department rental and delivery tracking
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS public.fleet_delivery_history CASCADE;
DROP TABLE IF EXISTS public.fleet_delivery_checklists CASCADE;
DROP TABLE IF EXISTS public.fleet_rental_agreements CASCADE;
DROP TABLE IF EXISTS public.subscribe_now_customers CASCADE;
DROP VIEW IF EXISTS public.subscribe_now_delivery_overview CASCADE;

-- 1. Subscribe Now Customers Table
CREATE TABLE IF NOT EXISTS public.subscribe_now_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) UNIQUE NOT NULL, -- Custom customer ID format
    customer_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    emirates_id VARCHAR(20),
    driving_license VARCHAR(50),
    passport_number VARCHAR(20),
    company_name VARCHAR(200),
    designation VARCHAR(100),
    
    -- Customer Status
    customer_type VARCHAR(20) DEFAULT 'Individual' CHECK (customer_type IN ('Individual', 'Corporate')),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 2. Fleet Rental Agreements Table
CREATE TABLE IF NOT EXISTS public.fleet_rental_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id SERIAL UNIQUE,
    rental_agreement_id VARCHAR(50) UNIQUE NOT NULL, -- Custom rental ID
    customer_id UUID NOT NULL REFERENCES public.subscribe_now_customers(id) ON DELETE RESTRICT,
    
    -- Vehicle Information
    desired_fleet_type VARCHAR(100) NOT NULL, -- e.g., "Sedan", "SUV", "Luxury"
    specific_vehicle_id UUID, -- Assigned vehicle (references fleet_vehicles_enhanced if exists)
    vehicle_number VARCHAR(50),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    
    -- Rental Financial Details
    original_rental_amount DECIMAL(10,2) NOT NULL,
    confirmed_amount DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2),
    
    -- Rental Duration
    rental_duration_months INTEGER NOT NULL,
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    
    -- Contract Details
    rental_contract_url TEXT, -- URL to uploaded contract document
    contract_upload_date TIMESTAMP WITH TIME ZONE,
    contract_signed_date DATE,
    
    -- Agreement Status
    agreement_status VARCHAR(20) DEFAULT 'Draft' CHECK (agreement_status IN ('Draft', 'Pending Approval', 'Approved', 'Active', 'Completed', 'Cancelled')),
    delivery_status VARCHAR(20) DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'In Progress', 'Completed', 'Failed')),
    delivery_progress INTEGER DEFAULT 0,
    
    -- Additional Details
    special_requirements TEXT,
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 3. Fleet Delivery Checklists Table (Complete Version)
CREATE TABLE IF NOT EXISTS public.fleet_delivery_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_agreement_id UUID NOT NULL REFERENCES public.fleet_rental_agreements(id) ON DELETE CASCADE,
    
    -- Pre-Delivery Preparation
    vehicle_inspection_completed BOOLEAN DEFAULT FALSE,
    vehicle_inspection_date TIMESTAMP WITH TIME ZONE,
    vehicle_inspection_by UUID,
    vehicle_inspection_notes TEXT,
    
    vehicle_cleaning_completed BOOLEAN DEFAULT FALSE,
    vehicle_cleaning_date TIMESTAMP WITH TIME ZONE,
    vehicle_cleaning_by UUID,
    vehicle_cleaning_notes TEXT,
    
    fuel_tank_filled BOOLEAN DEFAULT FALSE,
    fuel_fill_date TIMESTAMP WITH TIME ZONE,
    fuel_fill_by UUID,
    fuel_fill_notes TEXT,
    
    -- Documentation Verification
    customer_documents_verified BOOLEAN DEFAULT FALSE,
    documents_verification_date TIMESTAMP WITH TIME ZONE,
    documents_verified_by UUID,
    documents_verification_notes TEXT,
    
    rental_contract_signed BOOLEAN DEFAULT FALSE,
    contract_signing_date TIMESTAMP WITH TIME ZONE,
    contract_signed_by UUID,
    contract_signing_notes TEXT,
    
    payment_confirmation BOOLEAN DEFAULT FALSE,
    payment_confirmation_date TIMESTAMP WITH TIME ZONE,
    payment_confirmed_by UUID,
    payment_confirmation_notes TEXT,
    
    -- Vehicle Handover
    vehicle_keys_handed BOOLEAN DEFAULT FALSE,
    keys_handover_date TIMESTAMP WITH TIME ZONE,
    keys_handed_by UUID,
    keys_handover_notes TEXT,
    
    vehicle_demonstration BOOLEAN DEFAULT FALSE,
    demonstration_date TIMESTAMP WITH TIME ZONE,
    demonstration_by UUID,
    demonstration_notes TEXT,
    
    customer_orientation BOOLEAN DEFAULT FALSE,
    orientation_date TIMESTAMP WITH TIME ZONE,
    orientation_by UUID,
    orientation_notes TEXT,
    
    delivery_acknowledgment BOOLEAN DEFAULT FALSE,
    acknowledgment_date TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    acknowledgment_notes TEXT,
    
    -- Overall Completion Status
    all_items_completed BOOLEAN GENERATED ALWAYS AS (
        vehicle_inspection_completed AND 
        vehicle_cleaning_completed AND 
        fuel_tank_filled AND 
        customer_documents_verified AND 
        rental_contract_signed AND 
        payment_confirmation AND 
        vehicle_keys_handed AND 
        vehicle_demonstration AND 
        customer_orientation AND 
        delivery_acknowledgment
    ) STORED,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 4. Fleet Delivery History Table
CREATE TABLE IF NOT EXISTS public.fleet_delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_agreement_id UUID NOT NULL REFERENCES public.fleet_rental_agreements(id) ON DELETE CASCADE,
    checklist_item VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Started', 'Completed', 'Updated', 'Note Added', 'Issue Reported')),
    description TEXT,
    performed_by UUID,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 5. Create comprehensive view for Subscribe Now dashboard
CREATE OR REPLACE VIEW public.subscribe_now_delivery_overview AS
SELECT 
    fra.id as rental_id,
    fra.rental_agreement_id,
    fra.customer_id,
    snc.customer_id as customer_code,
    snc.customer_name,
    snc.email,
    snc.phone,
    snc.customer_type,
    fra.desired_fleet_type,
    fra.specific_vehicle_id,
    fra.vehicle_number,
    fra.vehicle_make,
    fra.vehicle_model,
    fra.original_rental_amount,
    fra.confirmed_amount,
    fra.security_deposit,
    fra.rental_duration_months,
    fra.rental_start_date,
    fra.rental_end_date,
    fra.agreement_status,
    fra.delivery_status,
    fra.delivery_progress,
    fra.rental_contract_url,
    fra.contract_signed_date,
    fra.special_requirements,
    fra.notes,
    fdc.vehicle_inspection_completed,
    fdc.vehicle_cleaning_completed,
    fdc.fuel_tank_filled,
    fdc.customer_documents_verified,
    fdc.rental_contract_signed,
    fdc.payment_confirmation,
    fdc.vehicle_keys_handed,
    fdc.vehicle_demonstration,
    fdc.customer_orientation,
    fdc.delivery_acknowledgment,
    fdc.all_items_completed,
    fra.created_at as rental_created_at,
    fra.updated_at as rental_updated_at
FROM public.fleet_rental_agreements fra
LEFT JOIN public.subscribe_now_customers snc ON fra.customer_id = snc.id
LEFT JOIN public.fleet_delivery_checklists fdc ON fra.id = fdc.rental_agreement_id
ORDER BY fra.created_at DESC;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribe_now_customers_customer_id ON public.subscribe_now_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribe_now_customers_email ON public.subscribe_now_customers(email);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_customer_id ON public.fleet_rental_agreements(customer_id);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_rental_agreement_id ON public.fleet_rental_agreements(rental_agreement_id);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_agreement_status ON public.fleet_rental_agreements(agreement_status);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_delivery_status ON public.fleet_rental_agreements(delivery_status);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_checklists_rental_agreement_id ON public.fleet_delivery_checklists(rental_agreement_id);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_history_rental_agreement_id ON public.fleet_delivery_history(rental_agreement_id);

-- 7. Create function to calculate delivery progress
CREATE OR REPLACE FUNCTION public.calculate_delivery_progress(rental_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER := 10; -- Total checklist items
    completed_items INTEGER := 0;
    progress_percentage INTEGER;
BEGIN
    SELECT 
        (CASE WHEN vehicle_inspection_completed THEN 1 ELSE 0 END) +
        (CASE WHEN vehicle_cleaning_completed THEN 1 ELSE 0 END) +
        (CASE WHEN fuel_tank_filled THEN 1 ELSE 0 END) +
        (CASE WHEN customer_documents_verified THEN 1 ELSE 0 END) +
        (CASE WHEN rental_contract_signed THEN 1 ELSE 0 END) +
        (CASE WHEN payment_confirmation THEN 1 ELSE 0 END) +
        (CASE WHEN vehicle_keys_handed THEN 1 ELSE 0 END) +
        (CASE WHEN vehicle_demonstration THEN 1 ELSE 0 END) +
        (CASE WHEN customer_orientation THEN 1 ELSE 0 END) +
        (CASE WHEN delivery_acknowledgment THEN 1 ELSE 0 END)
    INTO completed_items
    FROM public.fleet_delivery_checklists
    WHERE rental_agreement_id = rental_uuid;
    
    IF completed_items IS NULL THEN
        completed_items := 0;
    END IF;
    
    progress_percentage := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to update delivery status
CREATE OR REPLACE FUNCTION public.update_delivery_status()
RETURNS TRIGGER AS $$
DECLARE
    progress_pct INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Calculate progress percentage
    progress_pct := public.calculate_delivery_progress(NEW.rental_agreement_id);
    
    -- Determine status based on progress
    IF progress_pct = 0 THEN
        new_status := 'Pending';
    ELSIF progress_pct = 100 THEN
        new_status := 'Completed';
    ELSE
        new_status := 'In Progress';
    END IF;
    
    -- Update the rental agreement record
    UPDATE public.fleet_rental_agreements 
    SET 
        delivery_status = new_status,
        delivery_progress = progress_pct,
        updated_at = NOW()
    WHERE id = NEW.rental_agreement_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to automatically update delivery progress
DROP TRIGGER IF EXISTS trigger_update_delivery_progress ON public.fleet_delivery_checklists;
CREATE TRIGGER trigger_update_delivery_progress
    AFTER INSERT OR UPDATE ON public.fleet_delivery_checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_delivery_status();

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.subscribe_now_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_delivery_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_delivery_history ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for subscribe_now_customers
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.subscribe_now_customers;
CREATE POLICY "Enable read access for authenticated users" ON public.subscribe_now_customers
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.subscribe_now_customers;
CREATE POLICY "Enable insert for authenticated users" ON public.subscribe_now_customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.subscribe_now_customers;
CREATE POLICY "Enable update for authenticated users" ON public.subscribe_now_customers
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.subscribe_now_customers;
CREATE POLICY "Enable delete for authenticated users" ON public.subscribe_now_customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- 12. RLS Policies for fleet_rental_agreements
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.fleet_rental_agreements;
CREATE POLICY "Enable read access for authenticated users" ON public.fleet_rental_agreements
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fleet_rental_agreements;
CREATE POLICY "Enable insert for authenticated users" ON public.fleet_rental_agreements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fleet_rental_agreements;
CREATE POLICY "Enable update for authenticated users" ON public.fleet_rental_agreements
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.fleet_rental_agreements;
CREATE POLICY "Enable delete for authenticated users" ON public.fleet_rental_agreements
    FOR DELETE USING (auth.role() = 'authenticated');

-- 13. RLS Policies for fleet_delivery_checklists
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.fleet_delivery_checklists;
CREATE POLICY "Enable read access for authenticated users" ON public.fleet_delivery_checklists
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fleet_delivery_checklists;
CREATE POLICY "Enable insert for authenticated users" ON public.fleet_delivery_checklists
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fleet_delivery_checklists;
CREATE POLICY "Enable update for authenticated users" ON public.fleet_delivery_checklists
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.fleet_delivery_checklists;
CREATE POLICY "Enable delete for authenticated users" ON public.fleet_delivery_checklists
    FOR DELETE USING (auth.role() = 'authenticated');

-- 14. RLS Policies for fleet_delivery_history
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.fleet_delivery_history;
CREATE POLICY "Enable read access for authenticated users" ON public.fleet_delivery_history
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fleet_delivery_history;
CREATE POLICY "Enable insert for authenticated users" ON public.fleet_delivery_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fleet_delivery_history;
CREATE POLICY "Enable update for authenticated users" ON public.fleet_delivery_history
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.fleet_delivery_history;
CREATE POLICY "Enable delete for authenticated users" ON public.fleet_delivery_history
    FOR DELETE USING (auth.role() = 'authenticated');

-- 15. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_subscribe_now_customers_updated_at ON public.subscribe_now_customers;
CREATE TRIGGER update_subscribe_now_customers_updated_at
    BEFORE UPDATE ON public.subscribe_now_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fleet_rental_agreements_updated_at ON public.fleet_rental_agreements;
CREATE TRIGGER update_fleet_rental_agreements_updated_at
    BEFORE UPDATE ON public.fleet_rental_agreements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fleet_delivery_checklists_updated_at ON public.fleet_delivery_checklists;
CREATE TRIGGER update_fleet_delivery_checklists_updated_at
    BEFORE UPDATE ON public.fleet_delivery_checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fleet_delivery_history_updated_at ON public.fleet_delivery_history;
CREATE TRIGGER update_fleet_delivery_history_updated_at
    BEFORE UPDATE ON public.fleet_delivery_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Add comments for documentation
COMMENT ON TABLE public.subscribe_now_customers IS 'Customer information for Subscribe Now department long-term rentals';
COMMENT ON TABLE public.fleet_rental_agreements IS 'Fleet rental agreements and contracts for Subscribe Now customers';
COMMENT ON TABLE public.fleet_delivery_checklists IS 'Delivery checklist for fleet vehicles to Subscribe Now customers';
COMMENT ON TABLE public.fleet_delivery_history IS 'Historical tracking of delivery progress and activities';
COMMENT ON VIEW public.subscribe_now_delivery_overview IS 'Comprehensive view of Subscribe Now delivery operations with customer and rental details';

-- =====================================================
-- DONE! Subscribe Now Database Schema Created
-- =====================================================
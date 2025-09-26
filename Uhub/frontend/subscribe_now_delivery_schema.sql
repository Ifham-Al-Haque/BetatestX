-- Subscribe Now Fleet Delivery System Database Schema
-- This creates the rental and delivery tracking system for the Subscribe Now department

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table for Subscribe Now department
CREATE TABLE IF NOT EXISTS subscribe_now_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create fleet rental agreements table
CREATE TABLE IF NOT EXISTS fleet_rental_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_agreement_id VARCHAR(50) UNIQUE NOT NULL, -- Custom rental ID
    customer_id UUID NOT NULL REFERENCES subscribe_now_customers(id) ON DELETE RESTRICT,
    
    -- Vehicle Information
    desired_fleet_type VARCHAR(100) NOT NULL, -- e.g., "Sedan", "SUV", "Luxury"
    specific_vehicle_id UUID REFERENCES fleet_vehicles_enhanced(id), -- Assigned vehicle
    
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
    
    -- Additional Details
    special_requirements TEXT,
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create fleet delivery checklist table
CREATE TABLE IF NOT EXISTS fleet_delivery_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_agreement_id UUID NOT NULL REFERENCES fleet_rental_agreements(id) ON DELETE CASCADE,
    
    -- Pre-Delivery Preparation
    vehicle_inspection_completed BOOLEAN DEFAULT FALSE,
    vehicle_inspection_date TIMESTAMP WITH TIME ZONE,
    vehicle_inspection_by UUID REFERENCES employees(id),
    vehicle_inspection_notes TEXT,
    
    vehicle_cleaning_completed BOOLEAN DEFAULT FALSE,
    vehicle_cleaning_date TIMESTAMP WITH TIME ZONE,
    vehicle_cleaning_by UUID REFERENCES employees(id),
    vehicle_cleaning_notes TEXT,
    
    fuel_tank_filled BOOLEAN DEFAULT FALSE,
    fuel_fill_date TIMESTAMP WITH TIME ZONE,
    fuel_fill_by UUID REFERENCES employees(id),
    fuel_fill_notes TEXT,
    
    -- Documentation Verification
    customer_documents_verified BOOLEAN DEFAULT FALSE,
    documents_verification_date TIMESTAMP WITH TIME ZONE,
    documents_verified_by UUID REFERENCES employees(id),
    documents_verification_notes TEXT,
    
    rental_contract_signed BOOLEAN DEFAULT FALSE,
    contract_signing_date TIMESTAMP WITH TIME ZONE,
    contract_signed_by UUID REFERENCES employees(id),
    contract_signing_notes TEXT,
    
    payment_confirmation BOOLEAN DEFAULT FALSE,
    payment_confirmation_date TIMESTAMP WITH TIME ZONE,
    payment_confirmed_by UUID REFERENCES employees(id),
    payment_confirmation_notes TEXT,
    
    -- Vehicle Handover
    vehicle_keys_handed BOOLEAN DEFAULT FALSE,
    keys_handover_date TIMESTAMP WITH TIME ZONE,
    keys_handed_by UUID REFERENCES employees(id),
    keys_handover_notes TEXT,
    
    vehicle_demonstration BOOLEAN DEFAULT FALSE,
    demonstration_date TIMESTAMP WITH TIME ZONE,
    demonstration_by UUID REFERENCES employees(id),
    demonstration_notes TEXT,
    
    customer_orientation BOOLEAN DEFAULT FALSE,
    orientation_date TIMESTAMP WITH TIME ZONE,
    orientation_by UUID REFERENCES employees(id),
    orientation_notes TEXT,
    
    delivery_acknowledgment BOOLEAN DEFAULT FALSE,
    acknowledgment_date TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES employees(id),
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
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create delivery history tracking table
CREATE TABLE IF NOT EXISTS fleet_delivery_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_agreement_id UUID NOT NULL REFERENCES fleet_rental_agreements(id) ON DELETE CASCADE,
    checklist_item VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Started', 'Completed', 'Updated', 'Note Added', 'Issue Reported')),
    description TEXT,
    performed_by UUID NOT NULL REFERENCES employees(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to calculate delivery progress
CREATE OR REPLACE FUNCTION calculate_delivery_progress(rental_uuid UUID)
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
    FROM fleet_delivery_checklists
    WHERE rental_agreement_id = rental_uuid;
    
    IF completed_items IS NULL THEN
        completed_items := 0;
    END IF;
    
    progress_percentage := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create function to update delivery status
CREATE OR REPLACE FUNCTION update_delivery_status()
RETURNS TRIGGER AS $$
DECLARE
    progress_pct INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Calculate progress percentage
    progress_pct := calculate_delivery_progress(NEW.rental_agreement_id);
    
    -- Determine status based on progress
    IF progress_pct = 0 THEN
        new_status := 'Pending';
    ELSIF progress_pct = 100 THEN
        new_status := 'Completed';
    ELSE
        new_status := 'In Progress';
    END IF;
    
    -- Update the rental agreement record
    UPDATE fleet_rental_agreements 
    SET 
        delivery_status = new_status,
        updated_at = NOW()
    WHERE id = NEW.rental_agreement_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update delivery progress
CREATE TRIGGER trigger_update_delivery_progress
    AFTER INSERT OR UPDATE ON fleet_delivery_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_status();

-- Create comprehensive view for Subscribe Now dashboard
CREATE OR REPLACE VIEW subscribe_now_delivery_overview AS
SELECT 
    ra.id as rental_id,
    ra.rental_agreement_id,
    ra.customer_id,
    c.customer_id as customer_code,
    c.customer_name,
    c.email,
    c.phone,
    c.customer_type,
    ra.desired_fleet_type,
    v.vehicle_number,
    v.make as vehicle_make,
    v.model as vehicle_model,
    ra.original_rental_amount,
    ra.confirmed_amount,
    ra.security_deposit,
    ra.rental_duration_months,
    ra.rental_start_date,
    ra.rental_end_date,
    ra.agreement_status,
    ra.delivery_status,
    ra.rental_contract_url,
    ra.contract_signed_date,
    ra.special_requirements,
    dc.vehicle_inspection_completed,
    dc.vehicle_cleaning_completed,
    dc.fuel_tank_filled,
    dc.customer_documents_verified,
    dc.rental_contract_signed,
    dc.payment_confirmation,
    dc.vehicle_keys_handed,
    dc.vehicle_demonstration,
    dc.customer_orientation,
    dc.delivery_acknowledgment,
    dc.all_items_completed,
    calculate_delivery_progress(ra.id) as delivery_progress,
    ra.created_at as rental_created_at,
    creator.full_name as created_by_name,
    dept.name as department_name
FROM fleet_rental_agreements ra
LEFT JOIN subscribe_now_customers c ON ra.customer_id = c.id
LEFT JOIN fleet_vehicles_enhanced v ON ra.specific_vehicle_id = v.id
LEFT JOIN fleet_delivery_checklists dc ON ra.id = dc.rental_agreement_id
LEFT JOIN employees creator ON ra.created_by = creator.id
LEFT JOIN departments dept ON creator.department_id = dept.id
WHERE dept.name ILIKE '%Subscribe Now%' OR dept.name ILIKE '%Sales%';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribe_now_customers_customer_id ON subscribe_now_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribe_now_customers_name ON subscribe_now_customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_customer ON fleet_rental_agreements(customer_id);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_status ON fleet_rental_agreements(agreement_status);
CREATE INDEX IF NOT EXISTS idx_fleet_rental_agreements_delivery_status ON fleet_rental_agreements(delivery_status);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_checklists_rental ON fleet_delivery_checklists(rental_agreement_id);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_history_rental ON fleet_delivery_history(rental_agreement_id);

-- Insert sample data for testing
DO $$
DECLARE
    sample_customer_id UUID;
    sample_rental_id UUID;
    sample_employee_id UUID;
BEGIN
    -- Get a sample employee ID for testing
    SELECT id INTO sample_employee_id FROM employees LIMIT 1;
    
    IF sample_employee_id IS NOT NULL THEN
        -- Insert sample customer
        INSERT INTO subscribe_now_customers (
            customer_id, customer_name, email, phone, customer_type, created_by
        ) VALUES (
            'SN-CUST-001', 'Ahmed Al Mansouri', 'ahmed.almansouri@email.com', '+971501234567', 'Individual', sample_employee_id
        ) RETURNING id INTO sample_customer_id;
        
        -- Insert sample rental agreement
        INSERT INTO fleet_rental_agreements (
            rental_agreement_id, customer_id, desired_fleet_type, original_rental_amount, 
            confirmed_amount, security_deposit, rental_duration_months, rental_start_date, 
            rental_end_date, agreement_status, created_by
        ) VALUES (
            'SN-RENTAL-001', sample_customer_id, 'Luxury Sedan', 3500.00, 3200.00, 5000.00, 
            12, CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 year 7 days', 
            'Approved', sample_employee_id
        ) RETURNING id INTO sample_rental_id;
        
        -- Insert sample delivery checklist
        INSERT INTO fleet_delivery_checklists (
            rental_agreement_id, vehicle_inspection_completed, vehicle_cleaning_completed, 
            created_by
        ) VALUES (
            sample_rental_id, TRUE, FALSE, sample_employee_id
        );
        
        RAISE NOTICE 'Sample Subscribe Now data inserted successfully';
    ELSE
        RAISE NOTICE 'No employees found - skipping sample data insertion';
    END IF;
END $$;

-- Create RLS policies
ALTER TABLE subscribe_now_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_delivery_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_delivery_history ENABLE ROW LEVEL SECURITY;

-- Policies for subscribe_now_customers
CREATE POLICY "Users can view Subscribe Now customers" ON subscribe_now_customers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert Subscribe Now customers" ON subscribe_now_customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update Subscribe Now customers" ON subscribe_now_customers
    FOR UPDATE USING (true);

-- Policies for fleet_rental_agreements
CREATE POLICY "Users can view rental agreements" ON fleet_rental_agreements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert rental agreements" ON fleet_rental_agreements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update rental agreements" ON fleet_rental_agreements
    FOR UPDATE USING (true);

-- Policies for fleet_delivery_checklists
CREATE POLICY "Users can view delivery checklists" ON fleet_delivery_checklists
    FOR SELECT USING (true);

CREATE POLICY "Users can insert delivery checklists" ON fleet_delivery_checklists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update delivery checklists" ON fleet_delivery_checklists
    FOR UPDATE USING (true);

-- Policies for fleet_delivery_history
CREATE POLICY "Users can view delivery history" ON fleet_delivery_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert delivery history" ON fleet_delivery_history
    FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE subscribe_now_customers IS 'Customer information for Subscribe Now department long-term rentals';
COMMENT ON TABLE fleet_rental_agreements IS 'Fleet rental agreements and contracts for Subscribe Now customers';
COMMENT ON TABLE fleet_delivery_checklists IS 'Delivery checklist for fleet vehicles to Subscribe Now customers';
COMMENT ON TABLE fleet_delivery_history IS 'Historical tracking of delivery progress and activities';
COMMENT ON VIEW subscribe_now_delivery_overview IS 'Comprehensive view of Subscribe Now delivery operations with customer and rental details';

-- Enhanced Fleet Onboarding Database Schema
-- This extends the existing fleet management system with comprehensive onboarding support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update fleet_vehicles table with enhanced fields
CREATE TABLE IF NOT EXISTS fleet_vehicles_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Vehicle Information
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_year INTEGER NOT NULL,
    color VARCHAR(50),
    
    -- Vehicle Identification
    chassis_number VARCHAR(50) UNIQUE,  -- Also known as VIN
    vin_number VARCHAR(17) UNIQUE,      -- Standard VIN format
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    
    -- Technical Specifications
    fuel_type VARCHAR(20) DEFAULT 'Petrol',
    transmission VARCHAR(20) DEFAULT 'Manual',
    engine_size VARCHAR(20),
    mileage INTEGER DEFAULT 0,
    fuel_efficiency DECIMAL(5,2), -- km/l
    
    -- IoT and Technology
    iot_device_imei VARCHAR(20) UNIQUE,
    sim_card_imei VARCHAR(20) UNIQUE,
    
    -- Location and Assignment
    fleet_intended_location VARCHAR(200),
    department_id UUID REFERENCES departments(id),
    assigned_driver_id UUID REFERENCES employees(id),
    
    -- Dates and Financial
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    insurance_expiry DATE,
    registration_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    
    -- Status and Management
    status VARCHAR(20) DEFAULT 'Onboarding' CHECK (status IN ('Onboarding', 'Active', 'Maintenance', 'Out of Service', 'Retired')),
    onboarding_status VARCHAR(20) DEFAULT 'Not Started' CHECK (onboarding_status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    onboarding_progress INTEGER DEFAULT 0 CHECK (onboarding_progress >= 0 AND onboarding_progress <= 100),
    
    -- Additional Information
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create fleet_onboarding_checklists table
CREATE TABLE IF NOT EXISTS fleet_onboarding_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles_enhanced(id) ON DELETE CASCADE,
    
    -- Checklist Items
    car_registration BOOLEAN DEFAULT FALSE,
    car_registration_completed_at TIMESTAMP WITH TIME ZONE,
    car_registration_completed_by UUID REFERENCES employees(id),
    car_registration_notes TEXT,
    
    passing_certificate BOOLEAN DEFAULT FALSE,
    passing_completed_at TIMESTAMP WITH TIME ZONE,
    passing_completed_by UUID REFERENCES employees(id),
    passing_notes TEXT,
    
    iot_device_installation BOOLEAN DEFAULT FALSE,
    iot_installation_completed_at TIMESTAMP WITH TIME ZONE,
    iot_installation_completed_by UUID REFERENCES employees(id),
    iot_installation_notes TEXT,
    
    device_configuration BOOLEAN DEFAULT FALSE,
    device_config_completed_at TIMESTAMP WITH TIME ZONE,
    device_config_completed_by UUID REFERENCES employees(id),
    device_config_notes TEXT,
    
    branding_completed BOOLEAN DEFAULT FALSE,
    branding_completed_at TIMESTAMP WITH TIME ZONE,
    branding_completed_by UUID REFERENCES employees(id),
    branding_notes TEXT,
    
    salik_tag_installed BOOLEAN DEFAULT FALSE,
    salik_tag_completed_at TIMESTAMP WITH TIME ZONE,
    salik_tag_completed_by UUID REFERENCES employees(id),
    salik_tag_notes TEXT,
    
    vip_chip_installed BOOLEAN DEFAULT FALSE,
    vip_chip_completed_at TIMESTAMP WITH TIME ZONE,
    vip_chip_completed_by UUID REFERENCES employees(id),
    vip_chip_notes TEXT,
    
    -- Overall Status
    all_items_completed BOOLEAN GENERATED ALWAYS AS (
        car_registration AND 
        passing_certificate AND 
        iot_device_installation AND 
        device_configuration AND 
        branding_completed AND 
        salik_tag_installed AND 
        vip_chip_installed
    ) STORED,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create fleet_onboarding_history table for tracking progress
CREATE TABLE IF NOT EXISTS fleet_onboarding_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles_enhanced(id) ON DELETE CASCADE,
    checklist_item VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('Started', 'Completed', 'Updated', 'Note Added')),
    description TEXT,
    performed_by UUID NOT NULL REFERENCES employees(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing function if it exists with different parameter name
DROP FUNCTION IF EXISTS calculate_onboarding_progress(uuid);

-- Create function to calculate onboarding progress
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(vehicle_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_items INTEGER := 7; -- Total checklist items
    completed_items INTEGER := 0;
    progress_percentage INTEGER;
BEGIN
    SELECT 
        (CASE WHEN car_registration THEN 1 ELSE 0 END) +
        (CASE WHEN passing_certificate THEN 1 ELSE 0 END) +
        (CASE WHEN iot_device_installation THEN 1 ELSE 0 END) +
        (CASE WHEN device_configuration THEN 1 ELSE 0 END) +
        (CASE WHEN branding_completed THEN 1 ELSE 0 END) +
        (CASE WHEN salik_tag_installed THEN 1 ELSE 0 END) +
        (CASE WHEN vip_chip_installed THEN 1 ELSE 0 END)
    INTO completed_items
    FROM fleet_onboarding_checklists
    WHERE vehicle_id = vehicle_uuid;
    
    IF completed_items IS NULL THEN
        completed_items := 0;
    END IF;
    
    progress_percentage := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create function to update vehicle onboarding status
CREATE OR REPLACE FUNCTION update_vehicle_onboarding_status()
RETURNS TRIGGER AS $$
DECLARE
    progress_pct INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Calculate progress percentage
    progress_pct := calculate_onboarding_progress(NEW.vehicle_id);
    
    -- Determine status based on progress
    IF progress_pct = 0 THEN
        new_status := 'Not Started';
    ELSIF progress_pct = 100 THEN
        new_status := 'Completed';
    ELSE
        new_status := 'In Progress';
    END IF;
    
    -- Update the vehicle record
    UPDATE fleet_vehicles_enhanced 
    SET 
        onboarding_progress = progress_pct,
        onboarding_status = new_status,
        status = CASE WHEN progress_pct = 100 THEN 'Active' ELSE status END,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update progress
CREATE TRIGGER trigger_update_onboarding_progress
    AFTER INSERT OR UPDATE ON fleet_onboarding_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_onboarding_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_enhanced_status ON fleet_vehicles_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_enhanced_onboarding_status ON fleet_vehicles_enhanced(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_enhanced_department ON fleet_vehicles_enhanced(department_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_enhanced_driver ON fleet_vehicles_enhanced(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_enhanced_iot_imei ON fleet_vehicles_enhanced(iot_device_imei);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_enhanced_sim_imei ON fleet_vehicles_enhanced(sim_card_imei);
CREATE INDEX IF NOT EXISTS idx_fleet_onboarding_checklists_vehicle ON fleet_onboarding_checklists(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_onboarding_history_vehicle ON fleet_onboarding_history(vehicle_id);

-- Create view for comprehensive fleet onboarding data
CREATE OR REPLACE VIEW fleet_onboarding_overview AS
SELECT 
    v.id,
    v.vehicle_number,
    v.make,
    v.model,
    v.model_year,
    v.color,
    v.chassis_number,
    v.vin_number,
    v.license_plate,
    v.iot_device_imei,
    v.sim_card_imei,
    v.fleet_intended_location,
    v.status,
    v.onboarding_status,
    v.onboarding_progress,
    v.created_at as onboarding_started_at,
    d.name as department_name,
    e.full_name as assigned_driver_name,
    c.car_registration,
    c.passing_certificate,
    c.iot_device_installation,
    c.device_configuration,
    c.branding_completed,
    c.salik_tag_installed,
    c.vip_chip_installed,
    c.all_items_completed,
    creator.full_name as created_by_name
FROM fleet_vehicles_enhanced v
LEFT JOIN departments d ON v.department_id = d.id
LEFT JOIN employees e ON v.assigned_driver_id = e.id
LEFT JOIN fleet_onboarding_checklists c ON v.id = c.vehicle_id
LEFT JOIN employees creator ON v.created_by = creator.id;

-- Insert sample data for testing
INSERT INTO fleet_vehicles_enhanced (
    vehicle_number, make, model, model_year, color, chassis_number, vin_number, 
    license_plate, iot_device_imei, sim_card_imei, fleet_intended_location, 
    onboarding_status, created_by
) VALUES 
    ('FL-001', 'Toyota', 'Camry', 2023, 'White', 'JTDBE32K123456789', '1HGCM82633A123456', 'ABC-123', '123456789012345', '987654321098765', 'Dubai Marina', 'In Progress', (SELECT id FROM employees LIMIT 1)),
    ('FL-002', 'Honda', 'Civic', 2023, 'Silver', 'JHMFA16248S123456', '2HGCM82633A123456', 'XYZ-456', '123456789012346', '987654321098766', 'Business Bay', 'Not Started', (SELECT id FROM employees LIMIT 1));

-- Insert corresponding checklist records
INSERT INTO fleet_onboarding_checklists (vehicle_id, car_registration, passing_certificate, created_by)
SELECT id, TRUE, FALSE, (SELECT id FROM employees LIMIT 1)
FROM fleet_vehicles_enhanced 
WHERE vehicle_number IN ('FL-001', 'FL-002');

-- Create RLS policies (Row Level Security)
ALTER TABLE fleet_vehicles_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_onboarding_history ENABLE ROW LEVEL SECURITY;

-- Policy for fleet_vehicles_enhanced
CREATE POLICY "Users can view fleet vehicles" ON fleet_vehicles_enhanced
    FOR SELECT USING (true);

CREATE POLICY "Users can insert fleet vehicles" ON fleet_vehicles_enhanced
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update fleet vehicles" ON fleet_vehicles_enhanced
    FOR UPDATE USING (true);

-- Policy for fleet_onboarding_checklists
CREATE POLICY "Users can view onboarding checklists" ON fleet_onboarding_checklists
    FOR SELECT USING (true);

CREATE POLICY "Users can insert onboarding checklists" ON fleet_onboarding_checklists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update onboarding checklists" ON fleet_onboarding_checklists
    FOR UPDATE USING (true);

-- Policy for fleet_onboarding_history
CREATE POLICY "Users can view onboarding history" ON fleet_onboarding_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert onboarding history" ON fleet_onboarding_history
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE fleet_vehicles_enhanced IS 'Enhanced fleet vehicles table with comprehensive onboarding support';
COMMENT ON TABLE fleet_onboarding_checklists IS 'Fleet onboarding checklist items and their completion status';
COMMENT ON TABLE fleet_onboarding_history IS 'Historical record of onboarding progress and changes';
COMMENT ON VIEW fleet_onboarding_overview IS 'Comprehensive view of fleet onboarding data with related information';

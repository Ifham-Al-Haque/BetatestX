-- Fleet Management Database Schema (Fixed Version)
-- This creates all necessary tables for a complete fleet management system
-- Run this AFTER creating the departments table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, ensure departments table exists (create if it doesn't)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
        -- Create basic departments table if it doesn't exist
        CREATE TABLE departments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert some basic departments
        INSERT INTO departments (name, description) VALUES 
            ('IT Department', 'Information Technology and Systems'),
            ('HR Department', 'Human Resources and Administration'),
            ('Finance Department', 'Financial Management and Accounting'),
            ('Operations Department', 'Business Operations and Logistics'),
            ('Sales Department', 'Sales and Customer Relations'),
            ('Marketing Department', 'Marketing and Communications'),
            ('Engineering Department', 'Product Development and Engineering'),
            ('Customer Service', 'Customer Support and Service'),
            ('Legal Department', 'Legal Affairs and Compliance'),
            ('Facilities Management', 'Building and Infrastructure Management')
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Created departments table with basic data';
    END IF;
END $$;

-- Create fleet_vehicles table
CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(17) UNIQUE,
    color VARCHAR(50),
    fuel_type VARCHAR(20) DEFAULT 'Petrol',
    transmission VARCHAR(20) DEFAULT 'Manual',
    engine_size VARCHAR(20),
    mileage INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Out of Service', 'Retired')),
    department_id UUID REFERENCES departments(id),
    assigned_driver_id UUID REFERENCES employees(id),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    insurance_expiry DATE,
    registration_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    fuel_efficiency DECIMAL(5,2), -- km/l
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create fleet_maintenance table
CREATE TABLE IF NOT EXISTS fleet_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('Scheduled', 'Repair', 'Emergency', 'Inspection')),
    description TEXT NOT NULL,
    service_provider VARCHAR(100),
    cost DECIMAL(10,2),
    mileage_at_service INTEGER,
    service_date DATE NOT NULL,
    next_service_date DATE,
    status VARCHAR(20) DEFAULT 'Completed' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    technician_notes TEXT,
    parts_replaced TEXT[],
    labor_hours DECIMAL(5,2),
    invoice_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Create fleet_fuel_logs table
CREATE TABLE IF NOT EXISTS fleet_fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    fuel_date DATE NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    quantity_liters DECIMAL(8,2) NOT NULL,
    cost_per_liter DECIMAL(5,2) NOT NULL,
    total_cost DECIMAL(8,2) NOT NULL,
    mileage_at_fuel INTEGER NOT NULL,
    fuel_station VARCHAR(100),
    driver_id UUID REFERENCES employees(id),
    odometer_reading INTEGER,
    fuel_efficiency DECIMAL(5,2), -- calculated km/l
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Create fleet_drivers table (for driver assignments and history)
CREATE TABLE IF NOT EXISTS fleet_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    unassigned_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Create fleet_incidents table
CREATE TABLE IF NOT EXISTS fleet_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES employees(id),
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('Accident', 'Breakdown', 'Theft', 'Vandalism', 'Other')),
    description TEXT NOT NULL,
    location VARCHAR(200),
    severity VARCHAR(20) DEFAULT 'Minor' CHECK (severity IN ('Minor', 'Moderate', 'Major', 'Critical')),
    police_report_number VARCHAR(50),
    insurance_claim_number VARCHAR(50),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Under Investigation', 'Resolved', 'Closed')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_department ON fleet_vehicles(department_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_driver ON fleet_vehicles(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_vehicle ON fleet_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_date ON fleet_maintenance(service_date);
CREATE INDEX IF NOT EXISTS idx_fleet_fuel_vehicle ON fleet_fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_fuel_date ON fleet_fuel_logs(fuel_date);
CREATE INDEX IF NOT EXISTS idx_fleet_incidents_vehicle ON fleet_incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_incidents_date ON fleet_incidents(incident_date);

-- Enable Row Level Security (RLS)
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fleet_vehicles
CREATE POLICY "Users can view fleet vehicles" ON fleet_vehicles
    FOR SELECT USING (true);

CREATE POLICY "Managers can insert fleet vehicles" ON fleet_vehicles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

CREATE POLICY "Managers can update fleet vehicles" ON fleet_vehicles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

CREATE POLICY "Managers can delete fleet vehicles" ON fleet_vehicles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

-- Create RLS policies for fleet_maintenance
CREATE POLICY "Users can view maintenance records" ON fleet_maintenance
    FOR SELECT USING (true);

CREATE POLICY "Managers can insert maintenance records" ON fleet_maintenance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

CREATE POLICY "Managers can update maintenance records" ON fleet_maintenance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

-- Create RLS policies for fleet_fuel_logs
CREATE POLICY "Users can view fuel logs" ON fleet_fuel_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert fuel logs" ON fleet_fuel_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Managers can update fuel logs" ON fleet_fuel_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

-- Create RLS policies for fleet_drivers
CREATE POLICY "Users can view driver assignments" ON fleet_drivers
    FOR SELECT USING (true);

CREATE POLICY "Managers can manage driver assignments" ON fleet_drivers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

-- Create RLS policies for fleet_incidents
CREATE POLICY "Users can view incidents" ON fleet_incidents
    FOR SELECT USING (true);

CREATE POLICY "Users can report incidents" ON fleet_incidents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Managers can update incidents" ON fleet_incidents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND (role = 'manager' OR role = 'admin' OR role = 'fleet_manager')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fleet_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_fleet_vehicles_updated_at
    BEFORE UPDATE ON fleet_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_fleet_vehicles_updated_at();

-- Insert sample data for testing
INSERT INTO fleet_vehicles (
    vehicle_number, make, model, year, license_plate, 
    color, fuel_type, status, mileage, 
    insurance_expiry, registration_expiry, last_service_date
) VALUES 
    ('FLEET-001', 'Toyota', 'Hiace', 2022, 'ABC-123', 'White', 'Petrol', 'Active', 15000, '2025-01-15', '2025-06-30', '2024-01-10'),
    ('FLEET-002', 'Ford', 'Transit', 2021, 'XYZ-789', 'Blue', 'Diesel', 'Active', 22000, '2025-03-20', '2025-08-15', '2024-02-15'),
    ('FLEET-003', 'Mercedes', 'Sprinter', 2023, 'DEF-456', 'Silver', 'Diesel', 'Maintenance', 8000, '2025-05-10', '2025-10-20', '2024-03-01'),
    ('FLEET-004', 'Nissan', 'NV350', 2020, 'GHI-789', 'Black', 'Petrol', 'Active', 35000, '2024-12-31', '2025-04-15', '2024-01-20'),
    ('FLEET-005', 'Volkswagen', 'Crafter', 2022, 'JKL-012', 'Gray', 'Diesel', 'Out of Service', 18000, '2025-02-28', '2025-07-10', '2024-02-28')
ON CONFLICT (vehicle_number) DO NOTHING;

-- Insert sample maintenance records
INSERT INTO fleet_maintenance (
    vehicle_id, maintenance_type, description, service_provider, 
    cost, mileage_at_service, service_date, next_service_date
) VALUES 
    ((SELECT id FROM fleet_vehicles WHERE vehicle_number = 'FLEET-001'), 'Scheduled', 'Oil change and filter replacement', 'Toyota Service Center', 150.00, 15000, '2024-01-10', '2024-07-10'),
    ((SELECT id FROM fleet_vehicles WHERE vehicle_number = 'FLEET-003'), 'Repair', 'Brake system repair', 'Mercedes Service', 450.00, 8000, '2024-03-01', '2024-09-01'),
    ((SELECT id FROM fleet_vehicles WHERE vehicle_number = 'FLEET-005'), 'Emergency', 'Engine overheating repair', 'VW Service', 800.00, 18000, '2024-02-28', '2024-08-28')
ON CONFLICT DO NOTHING;

-- Insert sample fuel logs
INSERT INTO fleet_fuel_logs (
    vehicle_id, fuel_date, fuel_type, quantity_liters, 
    cost_per_liter, total_cost, mileage_at_fuel, fuel_station
) VALUES 
    ((SELECT id FROM fleet_vehicles WHERE vehicle_number = 'FLEET-001'), '2024-01-15', 'Petrol', 45.5, 1.85, 84.18, 15200, 'Shell Station'),
    ((SELECT id FROM fleet_vehicles WHERE vehicle_number = 'FLEET-002'), '2024-01-16', 'Diesel', 52.0, 1.65, 85.80, 22200, 'BP Station'),
    ((SELECT id FROM fleet_vehicles WHERE vehicle_number = 'FLEET-004'), '2024-01-17', 'Petrol', 48.0, 1.88, 90.24, 35200, 'Exxon Station')
ON CONFLICT DO NOTHING;

-- Create view for fleet overview
CREATE OR REPLACE VIEW fleet_overview AS
SELECT 
    fv.id,
    fv.vehicle_number,
    fv.make,
    fv.model,
    fv.year,
    fv.license_plate,
    fv.status,
    fv.mileage,
    fv.last_service_date,
    fv.next_service_date,
    fv.insurance_expiry,
    fv.registration_expiry,
    e.full_name as driver_name,
    d.name as department_name,
    COALESCE(fm.total_maintenance_cost, 0) as total_maintenance_cost,
    COALESCE(ff.total_fuel_cost, 0) as total_fuel_cost,
    COALESCE(ff.total_fuel_consumed, 0) as total_fuel_consumed
FROM fleet_vehicles fv
LEFT JOIN employees e ON fv.assigned_driver_id = e.id
LEFT JOIN departments d ON fv.department_id = d.id
LEFT JOIN (
    SELECT vehicle_id, SUM(cost) as total_maintenance_cost
    FROM fleet_maintenance 
    GROUP BY vehicle_id
) fm ON fv.id = fm.vehicle_id
LEFT JOIN (
    SELECT vehicle_id, SUM(total_cost) as total_fuel_cost, SUM(quantity_liters) as total_fuel_consumed
    FROM fleet_fuel_logs 
    GROUP BY vehicle_id
) ff ON fv.id = ff.vehicle_id;

-- Grant permissions
GRANT SELECT ON fleet_overview TO authenticated;
GRANT ALL ON fleet_vehicles TO authenticated;
GRANT ALL ON fleet_maintenance TO authenticated;
GRANT ALL ON fleet_fuel_logs TO authenticated;
GRANT ALL ON fleet_drivers TO authenticated;
GRANT ALL ON fleet_incidents TO authenticated;

-- Create function to get fleet statistics
CREATE OR REPLACE FUNCTION get_fleet_statistics()
RETURNS TABLE (
    total_vehicles INTEGER,
    active_vehicles INTEGER,
    maintenance_vehicles INTEGER,
    out_of_service_vehicles INTEGER,
    total_mileage BIGINT,
    avg_fuel_efficiency DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_vehicles,
        COUNT(*) FILTER (WHERE status = 'Active')::INTEGER as active_vehicles,
        COUNT(*) FILTER (WHERE status = 'Maintenance')::INTEGER as maintenance_vehicles,
        COUNT(*) FILTER (WHERE status = 'Out of Service')::INTEGER as out_of_service_vehicles,
        COALESCE(SUM(mileage), 0)::BIGINT as total_mileage,
        COALESCE(AVG(fuel_efficiency), 0)::DECIMAL(5,2) as avg_fuel_efficiency
    FROM fleet_vehicles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_fleet_statistics() TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fleet Management System created successfully!';
    RAISE NOTICE 'Tables created: fleet_vehicles, fleet_maintenance, fleet_fuel_logs, fleet_drivers, fleet_incidents';
    RAISE NOTICE 'Views created: fleet_overview';
    RAISE NOTICE 'Functions created: get_fleet_statistics()';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;

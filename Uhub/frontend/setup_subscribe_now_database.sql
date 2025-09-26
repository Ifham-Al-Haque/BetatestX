-- Quick Setup Script for Subscribe Now Fleet Delivery System
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure departments table exists with Subscribe Now department
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
        CREATE TABLE departments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    -- Insert Subscribe Now department if it doesn't exist
    INSERT INTO departments (name, description) VALUES 
        ('Subscribe Now', 'Fleet delivery and long-term rental sales department')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- Create the enhanced fleet vehicles table (if not exists)
CREATE TABLE IF NOT EXISTS fleet_vehicles_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_year INTEGER NOT NULL,
    color VARCHAR(50),
    chassis_number VARCHAR(50) UNIQUE,
    vin_number VARCHAR(17) UNIQUE,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    iot_device_imei VARCHAR(20) UNIQUE,
    sim_card_imei VARCHAR(20) UNIQUE,
    fleet_intended_location VARCHAR(200),
    department_id UUID REFERENCES departments(id),
    assigned_driver_id UUID REFERENCES employees(id),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    insurance_expiry DATE,
    registration_expiry DATE,
    last_service_date DATE,
    next_service_date DATE,
    fuel_type VARCHAR(20) DEFAULT 'Petrol',
    transmission VARCHAR(20) DEFAULT 'Manual',
    engine_size VARCHAR(20),
    mileage INTEGER DEFAULT 0,
    fuel_efficiency DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'Onboarding' CHECK (status IN ('Onboarding', 'Active', 'Maintenance', 'Out of Service', 'Retired')),
    onboarding_status VARCHAR(20) DEFAULT 'Not Started' CHECK (onboarding_status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    onboarding_progress INTEGER DEFAULT 0 CHECK (onboarding_progress >= 0 AND onboarding_progress <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Run the complete Subscribe Now schema
-- (Copy and paste the content from subscribe_now_delivery_schema.sql here)

-- Quick test to verify setup
SELECT 
    'Setup completed successfully!' as message,
    COUNT(*) as departments_count
FROM departments 
WHERE name ILIKE '%Subscribe Now%';

-- Display available tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%subscribe%' 
OR table_name LIKE '%rental%' 
OR table_name LIKE '%delivery%'
ORDER BY table_name;

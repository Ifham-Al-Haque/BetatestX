-- Delivery Management Database Tables
-- This creates all necessary tables for the fleet delivery system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create delivery_orders table
CREATE TABLE IF NOT EXISTS delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_coordinates POINT,
    delivery_coordinates POINT,
    order_type VARCHAR(50) DEFAULT 'Standard' CHECK (order_type IN ('Standard', 'Express', 'Scheduled', 'Bulk')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Failed', 'Cancelled')),
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    special_instructions TEXT,
    delivery_notes TEXT,
    signature_required BOOLEAN DEFAULT false,
    photo_proof_required BOOLEAN DEFAULT false,
    delivery_proof_url TEXT,
    signature_url TEXT,
    weight_kg DECIMAL(8,2),
    dimensions_cm VARCHAR(50), -- Format: "LxWxH"
    fragile BOOLEAN DEFAULT false,
    hazardous BOOLEAN DEFAULT false,
    insurance_value DECIMAL(10,2),
    delivery_fee DECIMAL(8,2),
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    payment_method VARCHAR(50),
    -- Rental duration information
    rental_duration VARCHAR(50),
    custom_duration VARCHAR(100),
    -- Manual driver information fields (from form)
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    driver_license VARCHAR(50),
    -- Manual vehicle information fields (from form)
    vehicle_number VARCHAR(20),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_plate VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id)
);

-- Create delivery_assignments table
CREATE TABLE IF NOT EXISTS delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    driver_id UUID NOT NULL REFERENCES employees(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES employees(id),
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_routes table
CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES employees(id),
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    status VARCHAR(30) DEFAULT 'Planned' CHECK (status IN ('Planned', 'Active', 'Completed', 'Cancelled')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_route_stops table
CREATE TABLE IF NOT EXISTS delivery_route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
    stop_sequence INTEGER NOT NULL,
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Skipped')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_incidents table
CREATE TABLE IF NOT EXISTS delivery_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    location VARCHAR(255),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by UUID REFERENCES employees(id),
    status VARCHAR(30) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_performance table
CREATE TABLE IF NOT EXISTS delivery_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    total_deliveries INTEGER DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_time_hours DECIMAL(5,2) DEFAULT 0,
    average_delivery_time_minutes DECIMAL(5,2) DEFAULT 0,
    customer_rating DECIMAL(3,2) DEFAULT 0,
    fuel_consumption_liters DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_priority ON delivery_orders(priority);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created_at ON delivery_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer_name ON delivery_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_driver_name ON delivery_orders(driver_name);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_vehicle_number ON delivery_orders(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver_id ON delivery_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_vehicle_id ON delivery_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_timestamp ON delivery_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_driver_id ON delivery_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_status ON delivery_routes(status);
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_route_id ON delivery_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_order_id ON delivery_route_stops(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_incidents_order_id ON delivery_incidents(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_incidents_reported_at ON delivery_incidents(reported_at);
CREATE INDEX IF NOT EXISTS idx_delivery_performance_driver_date ON delivery_performance(driver_id, date);

-- Create views for common queries

-- Delivery overview view
CREATE OR REPLACE VIEW delivery_overview AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.pickup_address,
    o.delivery_address,
    o.status,
    o.priority,
    o.order_type,
    o.estimated_delivery_time,
    o.actual_delivery_time,
    o.created_at,
    o.delivery_fee,
    o.payment_status,
    o.special_instructions,
    -- Rental duration information
    o.rental_duration,
    o.custom_duration,
    -- Manual driver fields (from form)
    o.driver_name,
    o.driver_phone,
    o.driver_license,
    -- Manual vehicle fields (from form)
    o.vehicle_number,
    o.vehicle_make,
    o.vehicle_model,
    o.vehicle_plate,
    -- Assigned driver/vehicle fields (from assignments)
    a.driver_id,
    e.full_name as assigned_driver_name,
    e.phone as assigned_driver_phone,
    a.vehicle_id,
    v.vehicle_number as assigned_vehicle_number,
    v.make as assigned_vehicle_make,
    v.model as assigned_vehicle_model,
    v.license_plate as assigned_vehicle_plate,
    a.assigned_at,
    a.actual_pickup_time,

    a.actual_delivery_time as assignment_actual_delivery_time
FROM delivery_orders o
LEFT JOIN delivery_assignments a ON o.id = a.order_id
LEFT JOIN employees e ON a.driver_id = e.id
LEFT JOIN fleet_vehicles v ON a.vehicle_id = v.id;

-- Driver performance summary view
CREATE OR REPLACE VIEW driver_performance_summary AS
SELECT 
    dp.driver_id,
    e.full_name as driver_name,
    e.email as driver_email,
    COUNT(DISTINCT dp.date) as total_days,
    SUM(dp.total_deliveries) as total_deliveries,
    SUM(dp.completed_deliveries) as completed_deliveries,
    SUM(dp.failed_deliveries) as failed_deliveries,
    SUM(dp.on_time_deliveries) as on_time_deliveries,
    SUM(dp.late_deliveries) as late_deliveries,
    AVG(dp.customer_rating) as avg_customer_rating,
    SUM(dp.total_distance_km) as total_distance_km,
    SUM(dp.total_time_hours) as total_time_hours,
    AVG(dp.average_delivery_time_minutes) as avg_delivery_time_minutes
FROM delivery_performance dp
LEFT JOIN employees e ON dp.driver_id = e.id
GROUP BY dp.driver_id, e.full_name, e.email;

-- Create functions for common operations

-- Function to assign delivery
CREATE OR REPLACE FUNCTION assign_delivery(
    p_order_id UUID,
    p_driver_id UUID,
    p_vehicle_id UUID DEFAULT NULL,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Create assignment
    INSERT INTO delivery_assignments (order_id, driver_id, vehicle_id, assigned_by)
    VALUES (p_order_id, p_driver_id, p_vehicle_id, p_assigned_by)
    RETURNING id INTO assignment_id;
    
    -- Update order status
    UPDATE delivery_orders 
    SET status = 'Assigned', updated_at = NOW(), updated_by = p_assigned_by
    WHERE id = p_order_id;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update delivery status
CREATE OR REPLACE FUNCTION update_delivery_status(
    p_order_id UUID,
    p_status VARCHAR,
    p_location VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_updated_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    tracking_id UUID;
BEGIN
    -- Update order status
    UPDATE delivery_orders 
    SET status = p_status, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = p_order_id;
    
    -- Create tracking entry
    INSERT INTO delivery_tracking (order_id, status, location, notes, created_by)
    VALUES (p_order_id, p_status, p_location, p_notes, p_updated_by)
    RETURNING id INTO tracking_id;
    
    RETURN tracking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get delivery statistics
CREATE OR REPLACE FUNCTION get_delivery_statistics()
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    in_transit_orders BIGINT,
    delivered_orders BIGINT,
    failed_orders BIGINT,
    total_revenue NUMERIC,
    avg_delivery_time_hours NUMERIC,
    on_time_delivery_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'In Transit') as in_transit_orders,
        COUNT(*) FILTER (WHERE status = 'Delivered') as delivered_orders,
        COUNT(*) FILTER (WHERE status = 'Failed') as failed_orders,
        COALESCE(SUM(delivery_fee), 0) as total_revenue,
        COALESCE(AVG(EXTRACT(EPOCH FROM (actual_delivery_time - created_at)) / 3600), 0) as avg_delivery_time_hours,
        COALESCE(
            (COUNT(*) FILTER (WHERE status = 'Delivered' AND actual_delivery_time <= estimated_delivery_time)::NUMERIC / 
             NULLIF(COUNT(*) FILTER (WHERE status = 'Delivered'), 0)) * 100, 
            0
        ) as on_time_delivery_rate
    FROM delivery_orders;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON delivery_orders TO authenticated;
GRANT ALL ON delivery_assignments TO authenticated;
GRANT ALL ON delivery_tracking TO authenticated;
GRANT ALL ON delivery_routes TO authenticated;
GRANT ALL ON delivery_route_stops TO authenticated;
GRANT ALL ON delivery_incidents TO authenticated;
GRANT ALL ON delivery_performance TO authenticated;
GRANT SELECT ON delivery_overview TO authenticated;
GRANT SELECT ON driver_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_delivery(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_delivery_status(UUID, VARCHAR, VARCHAR, TEXT, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE delivery_orders IS 'Main table for delivery orders with manual driver and vehicle information';
COMMENT ON COLUMN delivery_orders.driver_name IS 'Manually entered driver name from delivery form';
COMMENT ON COLUMN delivery_orders.driver_phone IS 'Manually entered driver phone from delivery form';
COMMENT ON COLUMN delivery_orders.driver_license IS 'Manually entered driver license number from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_number IS 'Manually entered vehicle number from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_make IS 'Manually entered vehicle make from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_model IS 'Manually entered vehicle model from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_plate IS 'Manually entered vehicle license plate from delivery form';

COMMENT ON TABLE delivery_assignments IS 'Links delivery orders to assigned drivers and vehicles';
COMMENT ON TABLE delivery_tracking IS 'Tracks delivery progress and status updates';
COMMENT ON TABLE delivery_routes IS 'Manages delivery routes and logistics';
COMMENT ON TABLE delivery_route_stops IS 'Individual stops on delivery routes';
COMMENT ON TABLE delivery_incidents IS 'Records delivery issues and incidents';
COMMENT ON TABLE delivery_performance IS 'Performance analytics for drivers and deliveries';

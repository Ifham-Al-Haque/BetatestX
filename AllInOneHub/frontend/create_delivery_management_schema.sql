-- Delivery Management Database Schema
-- This creates all necessary tables for a complete delivery management system

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
    estimated_pickup_time TIMESTAMP WITH TIME ZONE,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'In Progress', 'Completed', 'Failed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES delivery_assignments(id),
    status VARCHAR(30) NOT NULL,
    location VARCHAR(255),
    coordinates POINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID REFERENCES employees(id)
);

-- Create delivery_routes table
CREATE TABLE IF NOT EXISTS delivery_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES employees(id),
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    start_location VARCHAR(255) NOT NULL,
    end_location VARCHAR(255) NOT NULL,
    total_distance_km DECIMAL(8,2),
    estimated_duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Create delivery_route_stops table
CREATE TABLE IF NOT EXISTS delivery_route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
    order_id UUID REFERENCES delivery_orders(id),
    stop_sequence INTEGER NOT NULL,
    address TEXT NOT NULL,
    coordinates POINT,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    stop_type VARCHAR(20) DEFAULT 'Delivery' CHECK (stop_type IN ('Pickup', 'Delivery', 'Fuel', 'Break')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Skipped')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_incidents table
CREATE TABLE IF NOT EXISTS delivery_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES delivery_orders(id),
    assignment_id UUID REFERENCES delivery_assignments(id),
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('Accident', 'Breakdown', 'Theft', 'Damage', 'Customer Issue', 'Weather', 'Traffic', 'Other')),
    description TEXT NOT NULL,
    location VARCHAR(255),
    coordinates POINT,
    severity VARCHAR(20) DEFAULT 'Minor' CHECK (severity IN ('Minor', 'Moderate', 'Major', 'Critical')),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reported_by UUID REFERENCES employees(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Under Investigation', 'Resolved', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_performance table
CREATE TABLE IF NOT EXISTS delivery_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_time_hours DECIMAL(5,2) DEFAULT 0,
    average_delivery_time_minutes DECIMAL(5,2),
    customer_rating DECIMAL(3,2),
    fuel_consumed_liters DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_priority ON delivery_orders(priority);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created_at ON delivery_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_customer_name ON delivery_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON delivery_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_vehicle ON delivery_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_timestamp ON delivery_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_driver ON delivery_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_route ON delivery_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_delivery_incidents_order ON delivery_incidents(order_id);
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
    a.driver_id,
    e.full_name as driver_name,
    e.phone as driver_phone,
    a.vehicle_id,
    v.vehicle_number,
    v.make,
    v.model,
    v.license_plate,
    a.assigned_at,
    a.actual_pickup_time,
    a.actual_delivery_time
FROM delivery_orders o
LEFT JOIN delivery_assignments a ON o.id = a.order_id
LEFT JOIN employees e ON a.driver_id = e.id
LEFT JOIN fleet_vehicles v ON a.vehicle_id = v.id;

-- Driver performance view
CREATE OR REPLACE VIEW driver_performance_summary AS
SELECT 
    d.driver_id,
    e.full_name as driver_name,
    COUNT(DISTINCT d.order_id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'Delivered' THEN d.order_id END) as successful_deliveries,
    COUNT(DISTINCT CASE WHEN o.status = 'Failed' THEN d.order_id END) as failed_deliveries,
    ROUND(
        COUNT(DISTINCT CASE WHEN o.status = 'Delivered' THEN d.order_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT d.order_id), 0), 2
    ) as success_rate,
    AVG(EXTRACT(EPOCH FROM (o.actual_delivery_time - o.created_at))/3600) as avg_delivery_time_hours
FROM delivery_assignments d
JOIN delivery_orders o ON d.order_id = o.id
JOIN employees e ON d.driver_id = e.id
WHERE d.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.driver_id, e.full_name;

-- Create functions for common operations

-- Function to get delivery statistics
CREATE OR REPLACE FUNCTION get_delivery_statistics()
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    in_transit_orders BIGINT,
    delivered_orders BIGINT,
    failed_orders BIGINT,
    avg_delivery_time_hours DECIMAL,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'In Transit') as in_transit_orders,
        COUNT(*) FILTER (WHERE status = 'Delivered') as delivered_orders,
        COUNT(*) FILTER (WHERE status = 'Failed') as failed_orders,
        AVG(EXTRACT(EPOCH FROM (actual_delivery_time - created_at))/3600) as avg_delivery_time_hours,
        SUM(delivery_fee) as total_revenue
    FROM delivery_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to assign delivery to driver
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
    
    -- Add tracking entry
    INSERT INTO delivery_tracking (order_id, assignment_id, status, created_by)
    VALUES (p_order_id, assignment_id, 'Assigned', p_assigned_by);
    
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
RETURNS BOOLEAN AS $$
BEGIN
    -- Update order status
    UPDATE delivery_orders 
    SET 
        status = p_status,
        updated_at = NOW(),
        updated_by = p_updated_by,
        actual_delivery_time = CASE WHEN p_status = 'Delivered' THEN NOW() ELSE actual_delivery_time END
    WHERE id = p_order_id;
    
    -- Add tracking entry
    INSERT INTO delivery_tracking (order_id, status, location, notes, created_by)
    VALUES (p_order_id, p_status, p_location, p_notes, p_updated_by);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO delivery_orders (
    order_number, customer_name, customer_phone, customer_email,
    pickup_address, delivery_address, order_type, priority, status,
    estimated_delivery_time, special_instructions, weight_kg,
    delivery_fee, payment_status, created_by
) VALUES 
(
    'DEL-001', 'John Smith', '+1234567890', 'john@example.com',
    '123 Main St, Downtown', '456 Oak Ave, Suburb',
    'Standard', 'Medium', 'Pending',
    NOW() + INTERVAL '2 hours', 'Ring doorbell twice', 2.5,
    15.00, 'Paid', (SELECT id FROM employees LIMIT 1)
),
(
    'DEL-002', 'Sarah Johnson', '+1234567891', 'sarah@example.com',
    '789 Business Blvd, City Center', '321 Pine St, Residential',
    'Express', 'High', 'Assigned',
    NOW() + INTERVAL '1 hour', 'Fragile - handle with care', 1.2,
    25.00, 'Paid', (SELECT id FROM employees LIMIT 1)
),
(
    'DEL-003', 'Mike Wilson', '+1234567892', 'mike@example.com',
    '555 Industrial Way, Warehouse District', '888 Garden Lane, Suburb',
    'Bulk', 'Low', 'In Transit',
    NOW() + INTERVAL '3 hours', 'Heavy items - use dolly', 15.0,
    35.00, 'Paid', (SELECT id FROM employees LIMIT 1)
);

-- Create RLS policies
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_performance ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_orders
CREATE POLICY "Users can view delivery orders" ON delivery_orders
    FOR SELECT USING (true);

CREATE POLICY "Admin and managers can insert delivery orders" ON delivery_orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'driver_management')
        )
    );

CREATE POLICY "Admin and managers can update delivery orders" ON delivery_orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'driver_management')
        )
    );

-- RLS policies for delivery_assignments
CREATE POLICY "Users can view delivery assignments" ON delivery_assignments
    FOR SELECT USING (true);

CREATE POLICY "Admin and managers can manage delivery assignments" ON delivery_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'driver_management')
        )
    );

-- RLS policies for delivery_tracking
CREATE POLICY "Users can view delivery tracking" ON delivery_tracking
    FOR SELECT USING (true);

CREATE POLICY "Drivers can insert tracking updates" ON delivery_tracking
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'driver_management', 'employee')
        )
    );

-- Grant necessary permissions
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

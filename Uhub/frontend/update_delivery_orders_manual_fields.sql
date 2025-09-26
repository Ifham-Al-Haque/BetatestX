-- Update delivery_orders table to include manual driver and vehicle fields
-- This adds the fields that the FleetDeliveryChecklist form is trying to save

-- Add manual driver information fields
ALTER TABLE delivery_orders 
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS driver_license VARCHAR(50);

-- Add manual vehicle information fields  
ALTER TABLE delivery_orders
ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS vehicle_make VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(20);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_orders_driver_name ON delivery_orders(driver_name);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_vehicle_number ON delivery_orders(vehicle_number);

-- Update the delivery_overview view to include the new manual fields
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
    a.actual_delivery_time
FROM delivery_orders o
LEFT JOIN delivery_assignments a ON o.id = a.order_id
LEFT JOIN employees e ON a.driver_id = e.id
LEFT JOIN fleet_vehicles v ON a.vehicle_id = v.id;

-- Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON delivery_orders TO authenticated;

COMMENT ON COLUMN delivery_orders.driver_name IS 'Manually entered driver name from delivery form';
COMMENT ON COLUMN delivery_orders.driver_phone IS 'Manually entered driver phone from delivery form';
COMMENT ON COLUMN delivery_orders.driver_license IS 'Manually entered driver license number from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_number IS 'Manually entered vehicle number from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_make IS 'Manually entered vehicle make from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_model IS 'Manually entered vehicle model from delivery form';
COMMENT ON COLUMN delivery_orders.vehicle_plate IS 'Manually entered vehicle license plate from delivery form';

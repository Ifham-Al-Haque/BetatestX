-- Add rental duration columns to delivery_orders table
-- This script adds the rental duration fields to the existing delivery_orders table

-- Add rental duration columns
ALTER TABLE delivery_orders 
ADD COLUMN IF NOT EXISTS rental_duration VARCHAR(50),
ADD COLUMN IF NOT EXISTS custom_duration VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN delivery_orders.rental_duration IS 'Predefined rental duration (1_hour, 1_day, 1_week, etc.)';
COMMENT ON COLUMN delivery_orders.custom_duration IS 'Custom rental duration when rental_duration is set to custom';

-- Update the delivery_overview view to include rental duration fields
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

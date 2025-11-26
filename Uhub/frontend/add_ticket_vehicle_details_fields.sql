-- Add additional vehicle details fields to fleet_maintenance_tickets table
-- This allows storing vehicle information directly in the ticket for better tracking

-- Make vehicle_id nullable to allow manual entry
ALTER TABLE fleet_maintenance_tickets
ALTER COLUMN vehicle_id DROP NOT NULL;

-- Add new columns to fleet_maintenance_tickets table
ALTER TABLE fleet_maintenance_tickets
ADD COLUMN IF NOT EXISTS vehicle_id_text VARCHAR(100), -- Manual vehicle ID entry
ADD COLUMN IF NOT EXISTS vehicle_plate_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS hardware_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS garage_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS garage_location VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN fleet_maintenance_tickets.vehicle_id_text IS 'Manual vehicle ID entry (text) - used when vehicle_id (UUID) is not available';
COMMENT ON COLUMN fleet_maintenance_tickets.vehicle_plate_number IS 'Vehicle license plate number (can be different from fleet_vehicles.license_plate)';
COMMENT ON COLUMN fleet_maintenance_tickets.hardware_id IS 'Hardware/device ID associated with the vehicle';
COMMENT ON COLUMN fleet_maintenance_tickets.vehicle_model IS 'Vehicle model (can be manually entered)';
COMMENT ON COLUMN fleet_maintenance_tickets.vehicle_year IS 'Vehicle manufacturing year';
COMMENT ON COLUMN fleet_maintenance_tickets.vehicle_color IS 'Vehicle color';
COMMENT ON COLUMN fleet_maintenance_tickets.garage_name IS 'Name of the garage/service center where vehicle will be serviced';
COMMENT ON COLUMN fleet_maintenance_tickets.garage_location IS 'Location/address of the garage';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_garage ON fleet_maintenance_tickets(garage_name);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_plate ON fleet_maintenance_tickets(vehicle_plate_number);


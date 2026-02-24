-- Fleet Maintenance Tickets System
-- This creates a comprehensive ticketing system for fleet maintenance requests

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create fleet_maintenance_tickets table
CREATE TABLE IF NOT EXISTS fleet_maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    
    -- Ticket Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('Scheduled', 'Repair', 'Emergency', 'Inspection')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In Progress', 'Pending Parts', 'Completed', 'Cancelled', 'Closed')),
    
    -- Assignment & Tracking
    requested_by UUID REFERENCES employees(id),
    assigned_to UUID REFERENCES employees(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Service Details
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    estimated_completion_date DATE,
    service_date DATE,
    mileage_at_request INTEGER,
    
    -- Additional Information
    location VARCHAR(255), -- Where the vehicle is located
    urgency_reason TEXT, -- Why it's urgent if priority is Urgent
    attachments JSONB, -- For storing file URLs and metadata
    notes TEXT,
    
    -- Related Maintenance Record (when ticket is converted to maintenance record)
    maintenance_record_id UUID REFERENCES fleet_maintenance(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES employees(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_vehicle_id ON fleet_maintenance_tickets(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_status ON fleet_maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_priority ON fleet_maintenance_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_assigned_to ON fleet_maintenance_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_requested_by ON fleet_maintenance_tickets(requested_by);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_tickets_ticket_number ON fleet_maintenance_tickets(ticket_number);

-- Create function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    ticket_num VARCHAR(50);
    ticket_count INTEGER;
BEGIN
    -- Get count of tickets for today
    SELECT COUNT(*) INTO ticket_count
    FROM fleet_maintenance_tickets
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Generate ticket number: FMT-YYYYMMDD-XXXX
    ticket_num := 'FMT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((ticket_count + 1)::TEXT, 4, '0');
    
    NEW.ticket_number := ticket_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket number
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON fleet_maintenance_tickets;
CREATE TRIGGER trigger_generate_ticket_number
    BEFORE INSERT ON fleet_maintenance_tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fleet_maintenance_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_fleet_maintenance_tickets_updated_at ON fleet_maintenance_tickets;
CREATE TRIGGER trigger_update_fleet_maintenance_tickets_updated_at
    BEFORE UPDATE ON fleet_maintenance_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_fleet_maintenance_tickets_updated_at();

-- Create function to update status timestamps
CREATE OR REPLACE FUNCTION update_ticket_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Update assigned_at when status changes to Assigned or In Progress
    IF NEW.status IN ('Assigned', 'In Progress') AND OLD.status NOT IN ('Assigned', 'In Progress') THEN
        IF NEW.assigned_at IS NULL THEN
            NEW.assigned_at := NOW();
        END IF;
    END IF;
    
    -- Update completed_at when status changes to Completed
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        NEW.completed_at := NOW();
    END IF;
    
    -- Update closed_at when status changes to Closed
    IF NEW.status = 'Closed' AND OLD.status != 'Closed' THEN
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status timestamps
DROP TRIGGER IF EXISTS trigger_update_ticket_status_timestamps ON fleet_maintenance_tickets;
CREATE TRIGGER trigger_update_ticket_status_timestamps
    BEFORE UPDATE ON fleet_maintenance_tickets
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_ticket_status_timestamps();

-- Enable Row Level Security
ALTER TABLE fleet_maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Users can view tickets they created, are assigned to, or are admins/managers
-- Note: employees table is for employee records, users table is for UHub account holders
CREATE POLICY "Users can view relevant tickets" ON fleet_maintenance_tickets
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (
            -- Created by current user (user's employee_id matches ticket's requested_by)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND u.employee_id = fleet_maintenance_tickets.requested_by
            )
            OR
            -- Assigned to current user (user's employee_id matches ticket's assigned_to)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND u.employee_id = fleet_maintenance_tickets.assigned_to
            )
            OR
            -- Admin or Manager role (from users table)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.role IN ('admin', 'manager', 'fleet_manager')
            )
            OR
            -- Department manager can see tickets for vehicles in their department
            EXISTS (
                SELECT 1 FROM users u
                JOIN employees e ON e.id = u.employee_id
                JOIN departments d ON d.name = e.department
                JOIN fleet_vehicles fv ON fv.department_id = d.id
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND fv.id = fleet_maintenance_tickets.vehicle_id
                AND u.role IN ('manager', 'department_head')
            )
        )
    );

-- Policy: Users can create tickets
CREATE POLICY "Users can create tickets" ON fleet_maintenance_tickets
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND (
            -- User's employee_id matches requested_by (user must be linked to an employee)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND u.employee_id = fleet_maintenance_tickets.requested_by
            )
            OR
            -- Admin or Manager can create tickets for any employee
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.role IN ('admin', 'manager', 'fleet_manager')
            )
        )
    );

-- Policy: Users can update tickets they created, are assigned to, or are admins/managers
CREATE POLICY "Users can update relevant tickets" ON fleet_maintenance_tickets
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (
            -- Created by user (user's employee_id matches ticket's requested_by)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND u.employee_id = fleet_maintenance_tickets.requested_by
            )
            OR
            -- Assigned to user (user's employee_id matches ticket's assigned_to)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.employee_id IS NOT NULL
                AND u.employee_id = fleet_maintenance_tickets.assigned_to
            )
            OR
            -- Admin or Manager (from users table)
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.role IN ('admin', 'manager', 'fleet_manager')
            )
        )
    );

-- Policy: Only admins and managers can delete tickets
CREATE POLICY "Admins and managers can delete tickets" ON fleet_maintenance_tickets
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role IN ('admin', 'manager', 'fleet_manager')
        )
    );

-- Create view for ticket statistics
CREATE OR REPLACE VIEW fleet_maintenance_ticket_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'Open') as open_tickets,
    COUNT(*) FILTER (WHERE status = 'Assigned') as assigned_tickets,
    COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'Pending Parts') as pending_parts_tickets,
    COUNT(*) FILTER (WHERE status = 'Completed') as completed_tickets,
    COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled_tickets,
    COUNT(*) FILTER (WHERE status = 'Closed') as closed_tickets,
    COUNT(*) FILTER (WHERE priority = 'Urgent') as urgent_tickets,
    COUNT(*) FILTER (WHERE priority = 'High') as high_priority_tickets,
    COUNT(*) as total_tickets,
    SUM(actual_cost) FILTER (WHERE actual_cost IS NOT NULL) as total_cost,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) FILTER (WHERE completed_at IS NOT NULL) as avg_completion_days
FROM fleet_maintenance_tickets;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON fleet_maintenance_tickets TO authenticated;
GRANT SELECT ON fleet_maintenance_ticket_stats TO authenticated;


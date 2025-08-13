-- =====================================================
-- CREATE DRIVERS TABLE AND DRIVER DOCUMENTS TABLE
-- =====================================================

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    employee_id TEXT UNIQUE,
    designation TEXT,
    nationality TEXT,
    company_mobile TEXT,
    personal_mobile TEXT,
    emirates_id_no TEXT,
    driving_license_no TEXT,
    udrive_customer_account_id TEXT,
    service_car_plate TEXT,
    team_type TEXT,
    team_name TEXT,
    team_members TEXT,
    shift_type TEXT CHECK (shift_type IN ('Day', 'Night')),
    profile_picture TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver_documents table
CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('emirates_id_front', 'emirates_id_back', 'driving_license_front', 'driving_license_back', 'passport_copy')),
    document_url TEXT NOT NULL,
    passport_number TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_employee_id ON drivers(employee_id);
CREATE INDEX IF NOT EXISTS idx_drivers_team_type ON drivers(team_type);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE ON driver_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for drivers table
CREATE POLICY "Users can view driver records" ON drivers
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager', 'hr')
            UNION
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can insert driver records" ON drivers
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update driver records" ON drivers
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete driver records" ON drivers
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM employees WHERE role = 'admin'
        )
    );

-- Create RLS policies for driver_documents table
CREATE POLICY "Users can view driver documents" ON driver_documents
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager', 'hr')
            UNION
            SELECT id FROM employees WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can insert driver documents" ON driver_documents
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update driver documents" ON driver_documents
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM employees WHERE role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete driver documents" ON driver_documents
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM employees WHERE role = 'admin'
        )
    );

-- Insert sample data for testing
INSERT INTO drivers (
    full_name,
    employee_id,
    designation,
    nationality,
    company_mobile,
    personal_mobile,
    emirates_id_no,
    driving_license_no,
    udrive_customer_account_id,
    service_car_plate,
    team_type,
    team_name,
    team_members,
    shift_type,
    status
) VALUES 
    ('Ahmed Al Mansouri', 'DRV001', 'Senior Driver', 'UAE', '+971501234567', '+971501234568', '784-1985-1234567-8', 'DL123456789', 'UD001', 'ABC-123', 'Delivery', 'Team Alpha', 'Ahmed, Sara, Omar', 'Day', 'active'),
    ('Fatima Al Zaabi', 'DRV002', 'Driver', 'UAE', '+971502345678', '+971502345679', '784-1986-2345678-9', 'DL234567890', 'UD002', 'XYZ-789', 'Pickup', 'Team Beta', 'Fatima, Khalid', 'Night', 'active'),
    ('Mohammed Al Falasi', 'DRV003', 'Lead Driver', 'UAE', '+971503456789', '+971503456790', '784-1987-3456789-0', 'DL345678901', 'UD003', 'DEF-456', 'Delivery', 'Team Gamma', 'Mohammed, Aisha, Ali', 'Day', 'active')
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample documents for testing
INSERT INTO driver_documents (
    driver_id,
    document_type,
    document_url,
    passport_number
) VALUES 
    ((SELECT id FROM drivers WHERE employee_id = 'DRV001' LIMIT 1), 'emirates_id_front', 'https://example.com/documents/drv001_emirates_front.jpg', 'A12345678'),
    ((SELECT id FROM drivers WHERE employee_id = 'DRV001' LIMIT 1), 'emirates_id_back', 'https://example.com/documents/drv001_emirates_back.jpg', 'A12345678'),
    ((SELECT id FROM drivers WHERE employee_id = 'DRV001' LIMIT 1), 'driving_license_front', 'https://example.com/documents/drv001_license_front.jpg', 'A12345678'),
    ((SELECT id FROM drivers WHERE employee_id = 'DRV001' LIMIT 1), 'driving_license_back', 'https://example.com/documents/drv001_license_back.jpg', 'A12345678'),
    ((SELECT id FROM drivers WHERE employee_id = 'DRV001' LIMIT 1), 'passport_copy', 'https://example.com/documents/drv001_passport.jpg', 'A12345678')
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT '=== DRIVERS TABLE CREATED ===' as info;
SELECT COUNT(*) as driver_count FROM drivers;

SELECT '=== DRIVER DOCUMENTS TABLE CREATED ===' as info;
SELECT COUNT(*) as document_count FROM driver_documents;

SELECT '=== SAMPLE DRIVER DATA ===' as info;
SELECT full_name, employee_id, designation, team_type, shift_type, status
FROM drivers
ORDER BY created_at DESC
LIMIT 3;

SELECT '=== DRIVER MANAGEMENT SYSTEM SETUP COMPLETE ===' as info;
SELECT 'Your driver management system is now ready!' as success_message;

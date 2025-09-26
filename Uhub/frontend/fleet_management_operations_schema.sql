-- Fleet Management Operations Database Schema
-- Run this in Supabase SQL Editor to create tables for Fleet Operations

-- =============================================
-- Fleet Onboarding Tables
-- =============================================

-- Fleet Onboarding Records Table
CREATE TABLE IF NOT EXISTS fleet_onboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    onboarding_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    assigned_driver UUID REFERENCES drivers(id),
    department VARCHAR(100),
    estimated_completion_date DATE,
    actual_completion_date DATE,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet Onboarding Checklist Table
CREATE TABLE IF NOT EXISTS fleet_onboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    onboarding_id UUID REFERENCES fleet_onboarding_records(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id),
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Fleet Offboarding Tables
-- =============================================

-- Fleet Offboarding Records Table
CREATE TABLE IF NOT EXISTS fleet_offboarding_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    offboarding_date DATE NOT NULL,
    last_service_date DATE,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    assigned_driver UUID REFERENCES drivers(id),
    department VARCHAR(100),
    reason VARCHAR(255),
    reason_details TEXT,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    final_mileage INTEGER,
    condition_assessment TEXT,
    disposal_method VARCHAR(100),
    disposal_date DATE,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet Offboarding Checklist Table
CREATE TABLE IF NOT EXISTS fleet_offboarding_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    offboarding_id UUID REFERENCES fleet_offboarding_records(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id),
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Fleet Delivery Checklist Tables
-- =============================================

-- Fleet Delivery Records Table
CREATE TABLE IF NOT EXISTS fleet_delivery_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id UUID REFERENCES fleet_vehicles(id),
    vehicle_number VARCHAR(50) NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    driver_name VARCHAR(255),
    route TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    total_stops INTEGER DEFAULT 0,
    completed_stops INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet Delivery Checklist Table
CREATE TABLE IF NOT EXISTS fleet_delivery_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES fleet_delivery_records(id) ON DELETE CASCADE,
    checklist_item VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES employees(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES employees(id),
    due_time TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Enhanced Fleet Maintenance Records
-- =============================================

-- Enhanced Fleet Maintenance Records Table (extends existing)
CREATE TABLE IF NOT EXISTS fleet_maintenance_records_enhanced (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'emergency')),
    service_type VARCHAR(255) NOT NULL,
    description TEXT,
    service_date DATE NOT NULL,
    next_service_date DATE,
    next_service_mileage INTEGER,
    mileage INTEGER,
    cost DECIMAL(10,2) DEFAULT 0,
    service_provider VARCHAR(255),
    technician VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    parts_replaced TEXT[], -- Array of parts
    labor_hours DECIMAL(4,2) DEFAULT 0,
    invoice_number VARCHAR(100),
    warranty_until DATE,
    notes TEXT,
    attachments JSONB, -- For storing file URLs and metadata
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Subscription Management Tables
-- =============================================

-- Subscription Services Table
CREATE TABLE IF NOT EXISTS subscription_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(50) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time')),
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    subscriber_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES subscription_services(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Collections Management Tables
-- =============================================

-- Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT 'blue',
    is_public BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection Items Table
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT,
    thumbnail_url TEXT,
    metadata JSONB,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Create Indexes for Performance
-- =============================================

-- Fleet Onboarding Indexes
CREATE INDEX IF NOT EXISTS idx_fleet_onboarding_vehicle_id ON fleet_onboarding_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_onboarding_status ON fleet_onboarding_records(status);
CREATE INDEX IF NOT EXISTS idx_fleet_onboarding_date ON fleet_onboarding_records(onboarding_date);
CREATE INDEX IF NOT EXISTS idx_fleet_onboarding_checklist_onboarding_id ON fleet_onboarding_checklist(onboarding_id);

-- Fleet Offboarding Indexes
CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_vehicle_id ON fleet_offboarding_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_status ON fleet_offboarding_records(status);
CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_date ON fleet_offboarding_records(offboarding_date);
CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_checklist_offboarding_id ON fleet_offboarding_checklist(offboarding_id);

-- Fleet Delivery Indexes
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_vehicle_id ON fleet_delivery_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_driver_id ON fleet_delivery_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_status ON fleet_delivery_records(status);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_date ON fleet_delivery_records(delivery_date);
CREATE INDEX IF NOT EXISTS idx_fleet_delivery_checklist_delivery_id ON fleet_delivery_checklist(delivery_id);

-- Fleet Maintenance Indexes
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_enhanced_vehicle_id ON fleet_maintenance_records_enhanced(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_enhanced_status ON fleet_maintenance_records_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_enhanced_service_date ON fleet_maintenance_records_enhanced(service_date);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_enhanced_type ON fleet_maintenance_records_enhanced(maintenance_type);

-- Subscription Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_services_category ON subscription_services(category);
CREATE INDEX IF NOT EXISTS idx_subscription_services_active ON subscription_services(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_service_id ON user_subscriptions(service_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- Collections Indexes
CREATE INDEX IF NOT EXISTS idx_collections_created_by ON collections(created_by);
CREATE INDEX IF NOT EXISTS idx_collections_category ON collections(category);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_file_type ON collection_items(file_type);

-- =============================================
-- Enable Row Level Security (RLS)
-- =============================================

-- Fleet Management Tables
ALTER TABLE fleet_onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_offboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_offboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_delivery_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_maintenance_records_enhanced ENABLE ROW LEVEL SECURITY;

-- Subscription Tables
ALTER TABLE subscription_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Collections Tables
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for Fleet Management
-- =============================================

-- Fleet Onboarding Policies (Admin and Operation Management only)
CREATE POLICY "fleet_onboarding_records_select_policy" ON fleet_onboarding_records
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_onboarding_records_insert_policy" ON fleet_onboarding_records
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_onboarding_records_update_policy" ON fleet_onboarding_records
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

-- Similar policies for other fleet tables
CREATE POLICY "fleet_onboarding_checklist_all_policy" ON fleet_onboarding_checklist
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_offboarding_records_all_policy" ON fleet_offboarding_records
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_offboarding_checklist_all_policy" ON fleet_offboarding_checklist
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_delivery_records_all_policy" ON fleet_delivery_records
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_delivery_checklist_all_policy" ON fleet_delivery_checklist
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

CREATE POLICY "fleet_maintenance_enhanced_all_policy" ON fleet_maintenance_records_enhanced
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin', 'operation_management')
        )
    );

-- =============================================
-- RLS Policies for Subscriptions (All authenticated users)
-- =============================================

CREATE POLICY "subscription_services_select_policy" ON subscription_services
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "subscription_services_insert_policy" ON subscription_services
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin')
        )
    );

CREATE POLICY "user_subscriptions_select_policy" ON user_subscriptions
    FOR SELECT TO authenticated USING (
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin')
        )
    );

CREATE POLICY "user_subscriptions_insert_policy" ON user_subscriptions
    FOR INSERT TO authenticated WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "user_subscriptions_update_policy" ON user_subscriptions
    FOR UPDATE TO authenticated USING (
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.auth_user_id = auth.uid()
            AND users.role IN ('admin')
        )
    );

-- =============================================
-- RLS Policies for Collections (User-owned)
-- =============================================

CREATE POLICY "collections_select_policy" ON collections
    FOR SELECT TO authenticated USING (
        created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR is_public = true
    );

CREATE POLICY "collections_insert_policy" ON collections
    FOR INSERT TO authenticated WITH CHECK (
        created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "collections_update_policy" ON collections
    FOR UPDATE TO authenticated USING (
        created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "collections_delete_policy" ON collections
    FOR DELETE TO authenticated USING (
        created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "collection_items_select_policy" ON collection_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND (collections.created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR collections.is_public = true)
        )
    );

CREATE POLICY "collection_items_insert_policy" ON collection_items
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND collections.created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "collection_items_update_policy" ON collection_items
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND collections.created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "collection_items_delete_policy" ON collection_items
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM collections
            WHERE collections.id = collection_items.collection_id
            AND collections.created_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
    );

-- =============================================
-- Sample Data for Testing
-- =============================================

-- Insert sample subscription services
INSERT INTO subscription_services (name, category, description, price, billing_cycle, features, rating, subscriber_count) VALUES
('Premium Analytics', 'Analytics', 'Advanced analytics and reporting features', 29.99, 'monthly', ARRAY['Real-time Analytics', 'Custom Reports', 'Data Export', 'API Access'], 4.8, 1250),
('Fleet Management Pro', 'Fleet', 'Complete fleet management solution', 49.99, 'monthly', ARRAY['GPS Tracking', 'Maintenance Alerts', 'Driver Management', 'Route Optimization'], 4.9, 890),
('HR Suite', 'HR', 'Comprehensive HR management tools', 39.99, 'monthly', ARRAY['Employee Management', 'Payroll', 'Attendance', 'Performance Reviews'], 4.7, 2100),
('IT Services Plus', 'IT', 'Enhanced IT management and support', 34.99, 'monthly', ARRAY['Asset Management', 'Ticket System', 'Remote Support', 'Security Monitoring'], 4.6, 750);

-- =============================================
-- Success Message
-- =============================================

SELECT 'Fleet Management Operations Database Schema created successfully!' as message;





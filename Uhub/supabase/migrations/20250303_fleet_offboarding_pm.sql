-- Fleet Offboarding: records and checklist items
-- Run this in Supabase SQL Editor if tables do not exist.

-- Offboarding records (one per vehicle offboarding process)
CREATE TABLE IF NOT EXISTS fleet_offboarding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
  reason TEXT,
  offboarding_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  started_by UUID REFERENCES employees(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_records_vehicle ON fleet_offboarding_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_records_status ON fleet_offboarding_records(status);
CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_records_date ON fleet_offboarding_records(offboarding_date);

-- Checklist items for each offboarding record (default items inserted when record is created in app)
CREATE TABLE IF NOT EXISTS fleet_offboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offboarding_record_id UUID NOT NULL REFERENCES fleet_offboarding_records(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES employees(id),
  completed_at TIMESTAMPTZ,
  assigned_to TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_offboarding_items_record ON fleet_offboarding_checklist_items(offboarding_record_id);

-- PM (Preventive Maintenance) templates: e.g. "Oil Change every 5000 km"
CREATE TABLE IF NOT EXISTS fleet_pm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL,
  interval_km INTEGER,
  interval_days INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PM schedules: link template to vehicle, next due date/mileage
CREATE TABLE IF NOT EXISTS fleet_pm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES fleet_pm_templates(id) ON DELETE CASCADE,
  next_due_date DATE,
  next_due_mileage INTEGER,
  last_completed_at TIMESTAMPTZ,
  last_completed_mileage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_pm_schedules_vehicle ON fleet_pm_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_pm_schedules_next ON fleet_pm_schedules(next_due_date);

-- RLS (enable if you use RLS; adjust policies to your auth)
-- ALTER TABLE fleet_offboarding_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleet_offboarding_checklist_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleet_pm_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fleet_pm_schedules ENABLE ROW LEVEL SECURITY;

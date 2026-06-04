-- =============================================================================
-- Fleet vehicle photo + document attachments (DATABASE ONLY)
-- Run in Supabase SQL Editor.
--
-- Storage: do NOT run policies on storage.objects here — you will get:
--   ERROR 42501: must be owner of table objects
-- Create bucket + policies in Dashboard instead (see FLEET_ASSETS_STORAGE_SETUP.md).
-- =============================================================================

ALTER TABLE public.fleet_vehicles
  ADD COLUMN IF NOT EXISTS fleet_image_url TEXT;

COMMENT ON COLUMN public.fleet_vehicles.fleet_image_url IS 'Public URL of fleet/vehicle photo for cards and profile';

CREATE TABLE IF NOT EXISTS public.fleet_vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL DEFAULT 'other',
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_size_bytes BIGINT,
  notes TEXT,
  uploaded_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicle_documents_vehicle
  ON public.fleet_vehicle_documents(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicle_documents_type
  ON public.fleet_vehicle_documents(document_type);

COMMENT ON TABLE public.fleet_vehicle_documents IS 'Attachments per fleet vehicle (registration card, insurance, etc.)';

ALTER TABLE public.fleet_vehicle_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fleet_vehicle_documents_authenticated ON public.fleet_vehicle_documents;
CREATE POLICY fleet_vehicle_documents_authenticated ON public.fleet_vehicle_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_vehicle_documents TO authenticated;

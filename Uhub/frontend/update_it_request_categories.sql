-- IT Service Request categories — expanded, user-friendly list
-- Run in Supabase SQL Editor. Safe to re-run (upserts by name).

ALTER TABLE it_request_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE it_request_categories
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Ensure unique names for upsert (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'it_request_categories_name_key'
  ) THEN
    ALTER TABLE it_request_categories ADD CONSTRAINT it_request_categories_name_key UNIQUE (name);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

INSERT INTO it_request_categories (name, description, color, icon, sort_order, is_active) VALUES
  ('Support', 'General help, questions, and how-to assistance', '#14b8a6', 'headphones', 1, true),
  ('Technical Issue', 'Errors, bugs, or systems not working correctly', '#EF4444', 'wrench', 2, true),
  ('Access Request', 'Accounts, permissions, VPN, or password resets', '#F59E0B', 'key', 3, true),
  ('Asset Request', 'Laptops, monitors, peripherals, or equipment', '#3B82F6', 'laptop', 4, true),
  ('Maintenance', 'Scheduled maintenance, upgrades, or repairs', '#8B5CF6', 'settings', 5, true),
  ('Software Request', 'Installation, updates, or software licensing', '#06B6D4', 'code', 6, true),
  ('Network Issue', 'WiFi, VPN, internet, or connectivity problems', '#10B981', 'wifi', 7, true),
  ('Email & Communication', 'Email, phone, Teams, or messaging tools', '#6366F1', 'mail', 8, true),
  ('Security', 'Security incidents, malware, or suspicious activity', '#DC2626', 'shield', 9, true),
  ('Other', 'Anything that does not fit the categories above', '#6B7280', 'help-circle', 10, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();

-- Retire legacy category names (existing requests keep their category_id)
UPDATE it_request_categories SET is_active = false
WHERE name IN (
  'Hardware', 'Software', 'Network', 'Access', 'Email', 'Phone', 'Printer',
  'Backup', 'Hardware Request', 'Software Request', 'Network Issues', 'Email Issues'
)
AND name NOT IN (
  'Support', 'Technical Issue', 'Access Request', 'Asset Request', 'Maintenance',
  'Software Request', 'Network Issue', 'Email & Communication', 'Security', 'Other'
);

SELECT name, description, icon, sort_order, is_active
FROM it_request_categories
ORDER BY sort_order, name;

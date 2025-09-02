-- Fix IT Services Schema - Add missing columns
-- Run this after the main schema to add missing columns

-- 1. Add sort_order column to it_request_categories
ALTER TABLE it_request_categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Add closed_by column to it_requests table
ALTER TABLE it_requests 
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Update existing categories with sort order
UPDATE it_request_categories SET sort_order = 1 WHERE name = 'Hardware Request';
UPDATE it_request_categories SET sort_order = 2 WHERE name = 'Software Request';
UPDATE it_request_categories SET sort_order = 3 WHERE name = 'Access Request';
UPDATE it_request_categories SET sort_order = 4 WHERE name = 'Maintenance';
UPDATE it_request_categories SET sort_order = 5 WHERE name = 'Network Issues';
UPDATE it_request_categories SET sort_order = 6 WHERE name = 'Email Issues';
UPDATE it_request_categories SET sort_order = 7 WHERE name = 'Other';

-- 4. Create index for sort_order
CREATE INDEX IF NOT EXISTS idx_it_request_categories_sort_order ON it_request_categories(sort_order);

-- 5. Update the API query to use sort_order again
-- (This will be handled in the frontend code)

-- Success message
SELECT 'IT Services schema fixes applied successfully! 
- Added sort_order column to categories
- Added closed_by column to requests
- Updated existing data with proper sort orders' as status;

-- Populate IT Requests with Sample Data
-- This script adds sample data to test the IT Request system

-- First, let's check what we have
SELECT 'Current data counts:' as info;
SELECT 'Categories' as table_name, COUNT(*) as count FROM it_request_categories
UNION ALL
SELECT 'Priorities' as table_name, COUNT(*) as count FROM it_request_priorities
UNION ALL
SELECT 'Requests' as table_name, COUNT(*) as count FROM it_requests;

-- Insert sample IT requests
-- Note: Replace the user IDs with actual user IDs from your users table
INSERT INTO it_requests (
  title, 
  description, 
  category_id, 
  priority_id, 
  requester_id, 
  status, 
  request_type,
  estimated_completion_date
) VALUES
  (
    'Laptop Setup Request', 
    'Need help setting up new laptop for new employee John Smith. Includes software installation and email configuration.',
    (SELECT id FROM it_request_categories WHERE name = 'Hardware Request' LIMIT 1),
    (SELECT id FROM it_request_priorities WHERE name = 'Medium' LIMIT 1),
    (SELECT id FROM users LIMIT 1), -- Use first available user
    'open',
    'hardware',
    CURRENT_DATE + INTERVAL '3 days'
  ),
  (
    'Email Access Issue', 
    'Cannot access company email on mobile device. Getting authentication error.',
    (SELECT id FROM it_request_categories WHERE name = 'Email Issues' LIMIT 1),
    (SELECT id FROM it_request_priorities WHERE name = 'High' LIMIT 1),
    (SELECT id FROM users LIMIT 1), -- Use first available user
    'assigned',
    'access',
    CURRENT_DATE + INTERVAL '1 day'
  ),
  (
    'Software License Request', 
    'Need Adobe Creative Suite license for marketing department.',
    (SELECT id FROM it_request_categories WHERE name = 'Software Request' LIMIT 1),
    (SELECT id FROM it_request_priorities WHERE name = 'Low' LIMIT 1),
    (SELECT id FROM users LIMIT 1), -- Use first available user
    'in_progress',
    'software',
    CURRENT_DATE + INTERVAL '7 days'
  ),
  (
    'Network Connectivity Problem', 
    'WiFi keeps dropping in conference room B. Affecting meetings.',
    (SELECT id FROM it_request_categories WHERE name = 'Network Issues' LIMIT 1),
    (SELECT id FROM it_request_priorities WHERE name = 'Critical' LIMIT 1),
    (SELECT id FROM users LIMIT 1), -- Use first available user
    'open',
    'maintenance',
    CURRENT_DATE + INTERVAL '1 day'
  ),
  (
    'Password Reset', 
    'Forgot password for HR system. Need immediate access.',
    (SELECT id FROM it_request_categories WHERE name = 'Access Request' LIMIT 1),
    (SELECT id FROM it_request_priorities WHERE name = 'High' LIMIT 1),
    (SELECT id FROM users LIMIT 1), -- Use first available user
    'resolved',
    'access',
    CURRENT_DATE - INTERVAL '1 day'
  )
ON CONFLICT (request_number) DO NOTHING;

-- Verify the data was inserted
SELECT 'After inserting sample data:' as info;
SELECT 'Categories' as table_name, COUNT(*) as count FROM it_request_categories
UNION ALL
SELECT 'Priorities' as table_name, COUNT(*) as count FROM it_request_priorities
UNION ALL
SELECT 'Requests' as table_name, COUNT(*) as count FROM it_requests;

-- Show sample requests
SELECT 
  request_number,
  title,
  status,
  c.name as category,
  p.name as priority,
  u.full_name as requester
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN users u ON r.requester_id = u.id
ORDER BY r.created_at DESC
LIMIT 5;

-- Success message
SELECT 'Sample data inserted successfully! You should now see requests in your IT Request system.' as status;

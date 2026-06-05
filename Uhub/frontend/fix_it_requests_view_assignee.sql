-- Fix it_requests_with_details: assignee must come from users (assigned_to → users.id)
-- Run in Supabase SQL Editor if cards show "Assigned to Unknown"

CREATE OR REPLACE VIEW it_requests_with_details AS
SELECT
    r.*,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon,
    p.name AS priority_name,
    p.level AS priority_level,
    p.color AS priority_color,
    p.sla_hours,
    req_u.full_name AS requester_name,
    req_u.email AS requester_email,
    req_u.role AS requester_role,
    req_u.department AS requester_department,
    assignee_u.full_name AS assigned_to_name,
    assignee_u.email AS assigned_to_email
FROM it_requests r
LEFT JOIN it_request_categories c ON r.category_id = c.id
LEFT JOIN it_request_priorities p ON r.priority_id = p.id
LEFT JOIN users req_u ON req_u.auth_user_id = r.requester_id OR req_u.id = r.requester_id
LEFT JOIN users assignee_u ON assignee_u.id = r.assigned_to;

GRANT SELECT ON it_requests_with_details TO authenticated;

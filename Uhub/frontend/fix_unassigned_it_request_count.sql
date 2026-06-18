-- Fix: "IT requests" dashboard card showing wrong "X unassigned" count.
--
-- Problem:
--   get_it_request_stats() defined unassigned as:
--       assigned_to IS NULL AND status != 'closed'
--   This counts tickets that are resolved / cancelled / pending_approval (i.e.
--   already handled) as "unassigned", so the dashboard showed e.g. "4 unassigned"
--   even when there were 0 open tickets.
--
-- Fix:
--   "Unassigned" should only mean tickets that are still OPEN and have no owner:
--       assigned_to IS NULL AND status = 'open'
--
-- Run this in the Uhub Supabase project (qtugowosurgecytgswuo) SQL editor.

CREATE OR REPLACE FUNCTION get_it_request_stats(user_id UUID DEFAULT NULL, user_role TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    request_filter TEXT := '';
BEGIN
    -- Non-IT roles only see their own requests in the stats
    IF user_role NOT IN ('admin', 'it_manager', 'it_technician', 'super_admin') AND user_id IS NOT NULL THEN
        request_filter := 'WHERE requester_id = ''' || user_id || '''';
    END IF;

    EXECUTE format('
        SELECT json_build_object(
            ''total_requests'', COUNT(*),
            ''open_requests'', COUNT(*) FILTER (WHERE status = ''open''),
            ''assigned_requests'', COUNT(*) FILTER (WHERE status = ''assigned''),
            ''in_progress_requests'', COUNT(*) FILTER (WHERE status = ''in_progress''),
            ''pending_approval_requests'', COUNT(*) FILTER (WHERE status = ''pending_approval''),
            ''resolved_requests'', COUNT(*) FILTER (WHERE status = ''resolved''),
            ''closed_requests'', COUNT(*) FILTER (WHERE status = ''closed''),
            ''cancelled_requests'', COUNT(*) FILTER (WHERE status = ''cancelled''),
            -- FIXED: only count tickets that are still open AND have no assignee
            ''unassigned_requests'', COUNT(*) FILTER (WHERE assigned_to IS NULL AND status = ''open''),
            ''my_requests'', COUNT(*) FILTER (WHERE requester_id = %L),
            ''assigned_to_me'', COUNT(*) FILTER (WHERE assigned_to = (
                SELECT e.id FROM employees e JOIN users u ON u.employee_id = e.id WHERE u.id = %L
            ))
        )
        FROM it_requests %s
    ', user_id, user_id, request_filter)
    INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_it_request_stats(UUID, TEXT) TO authenticated;

-- Optional sanity check (run separately):
-- SELECT get_it_request_stats(NULL, 'admin');

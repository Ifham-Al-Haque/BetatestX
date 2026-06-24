-- HR-only: fetch who voted support / against on a suggestion (run after create_suggestion_votes.sql)

CREATE OR REPLACE FUNCTION get_suggestion_vote_breakdown(p_suggestion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
    ) THEN
        RAISE EXCEPTION 'Not authorized to view vote breakdown';
    END IF;

    RETURN jsonb_build_object(
        'support', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'voter_id', sv.voter_id,
                    'voter_name', COALESCE(u.full_name, 'Unknown user'),
                    'voter_email', u.email,
                    'voter_department', u.department,
                    'voted_at', sv.created_at
                )
                ORDER BY sv.created_at DESC
            )
            FROM suggestion_votes sv
            LEFT JOIN users u ON u.auth_user_id = sv.voter_id
            WHERE sv.suggestion_id = p_suggestion_id AND sv.vote_type = 'up'
        ), '[]'::jsonb),
        'against', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'voter_id', sv.voter_id,
                    'voter_name', COALESCE(u.full_name, 'Unknown user'),
                    'voter_email', u.email,
                    'voter_department', u.department,
                    'voted_at', sv.created_at
                )
                ORDER BY sv.created_at DESC
            )
            FROM suggestion_votes sv
            LEFT JOIN users u ON u.auth_user_id = sv.voter_id
            WHERE sv.suggestion_id = p_suggestion_id AND sv.vote_type = 'down'
        ), '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_suggestion_vote_breakdown(UUID) TO authenticated;

COMMENT ON FUNCTION get_suggestion_vote_breakdown IS 'HR/admin: list of UHub users who voted support or against on a suggestion';

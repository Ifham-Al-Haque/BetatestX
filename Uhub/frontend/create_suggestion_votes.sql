-- Per-user suggestion voting (poll-style: one vote per UHub user per suggestion)
-- Keeps suggestions.upvotes / suggestions.downvotes in sync via trigger

CREATE TABLE IF NOT EXISTS suggestion_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (suggestion_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON suggestion_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_voter_id ON suggestion_votes(voter_id);

-- Recalculate denormalized counts on suggestions
CREATE OR REPLACE FUNCTION sync_suggestion_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
    sid UUID;
BEGIN
    sid := COALESCE(NEW.suggestion_id, OLD.suggestion_id);

    UPDATE suggestions
    SET
        upvotes = (
            SELECT COUNT(*)::INTEGER FROM suggestion_votes
            WHERE suggestion_id = sid AND vote_type = 'up'
        ),
        downvotes = (
            SELECT COUNT(*)::INTEGER FROM suggestion_votes
            WHERE suggestion_id = sid AND vote_type = 'down'
        ),
        updated_at = NOW()
    WHERE id = sid;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_suggestion_votes ON suggestion_votes;
CREATE TRIGGER trg_sync_suggestion_votes
    AFTER INSERT OR UPDATE OR DELETE ON suggestion_votes
    FOR EACH ROW
    EXECUTE FUNCTION sync_suggestion_vote_counts();

-- Auto-update updated_at on vote row
CREATE OR REPLACE FUNCTION update_suggestion_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_suggestion_votes_updated_at ON suggestion_votes;
CREATE TRIGGER trg_suggestion_votes_updated_at
    BEFORE UPDATE ON suggestion_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_suggestion_votes_updated_at();

-- Can the current auth user see (and vote on) this suggestion?
CREATE OR REPLACE FUNCTION can_vote_on_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM suggestions s
        WHERE s.id = p_suggestion_id
        AND (
            s.suggester_id = auth.uid()
            OR s.target_user_id = auth.uid()
            OR s.suggestion_type = 'general'
            OR EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_user_id = auth.uid()
                AND u.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION can_vote_on_suggestion(UUID) TO authenticated;

-- Cast / change / remove vote (toggle off when same type clicked again)
CREATE OR REPLACE FUNCTION cast_suggestion_vote(
    p_suggestion_id UUID,
    p_vote_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_existing TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_vote_type NOT IN ('up', 'down') THEN
        RAISE EXCEPTION 'Invalid vote type. Use up or down.';
    END IF;

    IF NOT can_vote_on_suggestion(p_suggestion_id) THEN
        RAISE EXCEPTION 'You cannot vote on this suggestion';
    END IF;

    SELECT vote_type INTO v_existing
    FROM suggestion_votes
    WHERE suggestion_id = p_suggestion_id AND voter_id = v_user_id;

    IF v_existing IS NULL THEN
        INSERT INTO suggestion_votes (suggestion_id, voter_id, vote_type)
        VALUES (p_suggestion_id, v_user_id, p_vote_type);
    ELSIF v_existing = p_vote_type THEN
        DELETE FROM suggestion_votes
        WHERE suggestion_id = p_suggestion_id AND voter_id = v_user_id;
    ELSE
        UPDATE suggestion_votes
        SET vote_type = p_vote_type
        WHERE suggestion_id = p_suggestion_id AND voter_id = v_user_id;
    END IF;

    RETURN (
        SELECT jsonb_build_object(
            'suggestion_id', s.id,
            'upvotes', s.upvotes,
            'downvotes', s.downvotes,
            'user_vote', (
                SELECT vote_type FROM suggestion_votes
                WHERE suggestion_id = p_suggestion_id AND voter_id = v_user_id
            )
        )
        FROM suggestions s
        WHERE s.id = p_suggestion_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION cast_suggestion_vote(UUID, TEXT) TO authenticated;

-- RLS
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own suggestion votes" ON suggestion_votes;
CREATE POLICY "Users view own suggestion votes" ON suggestion_votes
    FOR SELECT USING (voter_id = auth.uid());

DROP POLICY IF EXISTS "HR view all suggestion votes" ON suggestion_votes;
CREATE POLICY "HR view all suggestion votes" ON suggestion_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
            AND u.role IN ('admin', 'hr_manager', 'cs_manager', 'manager')
        )
    );

-- Writes go through cast_suggestion_vote (SECURITY DEFINER); block direct client writes
DROP POLICY IF EXISTS "Block direct vote inserts" ON suggestion_votes;
CREATE POLICY "Block direct vote inserts" ON suggestion_votes
    FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Block direct vote updates" ON suggestion_votes;
CREATE POLICY "Block direct vote updates" ON suggestion_votes
    FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Block direct vote deletes" ON suggestion_votes;
CREATE POLICY "Block direct vote deletes" ON suggestion_votes
    FOR DELETE USING (false);

GRANT SELECT ON suggestion_votes TO authenticated;

-- Reset legacy anonymous counters; real totals come from suggestion_votes rows
UPDATE suggestions SET upvotes = 0, downvotes = 0;

COMMENT ON TABLE suggestion_votes IS 'One vote per auth user per suggestion (up/down poll)';
COMMENT ON FUNCTION cast_suggestion_vote IS 'Upsert, switch, or remove the current user vote on a suggestion';

-- HR vote breakdown (also in add_suggestion_vote_breakdown_hr.sql for incremental apply)
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

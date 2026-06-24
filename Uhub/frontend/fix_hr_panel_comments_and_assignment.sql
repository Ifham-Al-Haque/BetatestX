-- HR Panel: comment threads + assign-to UHub user (users.id)
-- Run in Supabase SQL editor. Safe to re-run (IF NOT EXISTS / DROP IF EXISTS).

-- Ensure helper exists (from complaints dual-access migration)
CREATE OR REPLACE FUNCTION is_admin_or_hr_manager()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN user_role IN ('admin', 'hr_manager');
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Display name cache for assignee (users.id stored in assigned_to)
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255);
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255);

-- Clear orphaned assignees before FK to users(id)
UPDATE complaints SET assigned_to = NULL, assigned_to_name = NULL
WHERE assigned_to IS NOT NULL
  AND assigned_to NOT IN (SELECT id FROM users);

UPDATE suggestions SET assigned_to = NULL, assigned_to_name = NULL
WHERE assigned_to IS NOT NULL
  AND assigned_to NOT IN (SELECT id FROM users);

-- Point assigned_to at UHub users table (matches IT Requests pattern)
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_assigned_to_fkey;
ALTER TABLE suggestions DROP CONSTRAINT IF EXISTS suggestions_assigned_to_fkey;

ALTER TABLE complaints
  ADD CONSTRAINT complaints_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE suggestions
  ADD CONSTRAINT suggestions_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Complaint comments
CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_created_at ON complaint_comments(created_at);

ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR can manage complaint comments" ON complaint_comments;
DROP POLICY IF EXISTS "Complainant can view public complaint comments" ON complaint_comments;
DROP POLICY IF EXISTS "Complainant can reply to own complaint" ON complaint_comments;

CREATE POLICY "HR can manage complaint comments" ON complaint_comments
  FOR ALL USING (is_admin_or_hr_manager())
  WITH CHECK (is_admin_or_hr_manager());

CREATE POLICY "Complainant can view public complaint comments" ON complaint_comments
  FOR SELECT USING (
    is_internal = FALSE
    AND EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_comments.complaint_id
        AND c.complainant_id = auth.uid()
    )
  );

CREATE POLICY "Complainant can reply to own complaint" ON complaint_comments
  FOR INSERT WITH CHECK (
    is_internal = FALSE
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_comments.complaint_id
        AND c.complainant_id = auth.uid()
    )
  );

-- Suggestion comments
CREATE TABLE IF NOT EXISTS suggestion_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggestion_comments_suggestion_id ON suggestion_comments(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_comments_created_at ON suggestion_comments(created_at);

ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "HR can manage suggestion comments" ON suggestion_comments;
DROP POLICY IF EXISTS "Suggester can view public suggestion comments" ON suggestion_comments;
DROP POLICY IF EXISTS "Suggester can reply to own suggestion" ON suggestion_comments;

CREATE POLICY "HR can manage suggestion comments" ON suggestion_comments
  FOR ALL USING (is_admin_or_hr_manager())
  WITH CHECK (is_admin_or_hr_manager());

CREATE POLICY "Suggester can view public suggestion comments" ON suggestion_comments
  FOR SELECT USING (
    is_internal = FALSE
    AND EXISTS (
      SELECT 1 FROM suggestions s
      WHERE s.id = suggestion_comments.suggestion_id
        AND s.suggester_id = auth.uid()
    )
  );

CREATE POLICY "Suggester can reply to own suggestion" ON suggestion_comments
  FOR INSERT WITH CHECK (
    is_internal = FALSE
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM suggestions s
      WHERE s.id = suggestion_comments.suggestion_id
        AND s.suggester_id = auth.uid()
    )
  );

COMMENT ON TABLE complaint_comments IS 'HR response thread on complaints; is_internal hidden from complainant';
COMMENT ON TABLE suggestion_comments IS 'HR response thread on suggestions; is_internal hidden from suggester';

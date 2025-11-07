-- Task Notes System Database Schema
-- This creates tables for personal and shared task notes with tagging and sharing functionality

-- Create task_notes table for personal and shared notes
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- User who created the note
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false, -- If true, only visible to creator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_note_shares table for sharing notes with specific users
CREATE TABLE IF NOT EXISTS task_note_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES task_notes(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- User the note is shared with
  shared_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- User who shared the note
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, shared_with_user_id) -- Prevent duplicate shares
);

-- Create task_note_tags table for tagging users in notes
CREATE TABLE IF NOT EXISTS task_note_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES task_notes(id) ON DELETE CASCADE NOT NULL,
  tagged_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- User tagged in the note
  tagged_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- User who created the tag
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, tagged_user_id) -- Prevent duplicate tags
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON task_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_is_private ON task_notes(is_private);
CREATE INDEX IF NOT EXISTS idx_task_note_shares_note_id ON task_note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_task_note_shares_shared_with ON task_note_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_task_note_tags_note_id ON task_note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_task_note_tags_tagged_user ON task_note_tags(tagged_user_id);

-- Enable Row Level Security
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_note_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_notes
-- Users can view notes they created, notes shared with them, or public notes for tasks they have access to
CREATE POLICY "Users can view their own notes and shared notes" ON task_notes
  FOR SELECT
  USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR id IN (
      SELECT note_id FROM task_note_shares 
      WHERE shared_with_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
    OR (is_private = false AND task_id IN (
      SELECT id FROM tasks 
      WHERE assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR assigned_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    ))
  );

-- Users can create notes for tasks they have access to
CREATE POLICY "Users can create notes for accessible tasks" ON task_notes
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND task_id IN (
      SELECT id FROM tasks 
      WHERE assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR assigned_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes" ON task_notes
  FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes" ON task_notes
  FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for task_note_shares
-- Users can view shares where they are the sharer or sharee
CREATE POLICY "Users can view their note shares" ON task_note_shares
  FOR SELECT
  USING (
    shared_by_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR shared_with_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Users can create shares for notes they own
CREATE POLICY "Users can share their notes" ON task_note_shares
  FOR INSERT
  WITH CHECK (
    shared_by_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND note_id IN (
      SELECT id FROM task_notes 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Users can delete shares they created
CREATE POLICY "Users can delete their note shares" ON task_note_shares
  FOR DELETE
  USING (shared_by_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS Policies for task_note_tags
-- Users can view tags in notes they can see
CREATE POLICY "Users can view note tags" ON task_note_tags
  FOR SELECT
  USING (
    note_id IN (
      SELECT id FROM task_notes 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR id IN (
        SELECT note_id FROM task_note_shares 
        WHERE shared_with_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
      OR (is_private = false AND task_id IN (
        SELECT id FROM tasks 
        WHERE assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR assigned_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      ))
    )
  );

-- Users can create tags in notes they own or have access to
CREATE POLICY "Users can tag in accessible notes" ON task_note_tags
  FOR INSERT
  WITH CHECK (
    tagged_by_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND note_id IN (
      SELECT id FROM task_notes 
      WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR id IN (
        SELECT note_id FROM task_note_shares 
        WHERE shared_with_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
      OR (is_private = false AND task_id IN (
        SELECT id FROM tasks 
        WHERE assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR assigned_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      ))
    )
  );

-- Users can delete tags they created
CREATE POLICY "Users can delete their note tags" ON task_note_tags
  FOR DELETE
  USING (tagged_by_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Function to get all notes for a task (with sharing and tagging info)
CREATE OR REPLACE FUNCTION get_task_notes(p_task_id UUID, p_user_id UUID)
RETURNS TABLE (
  note_id UUID,
  content TEXT,
  is_private BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by_user_id UUID,
  created_by_name TEXT,
  created_by_email TEXT,
  is_shared_with_me BOOLEAN,
  shared_with_users JSONB,
  tagged_users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tn.id AS note_id,
    tn.content,
    tn.is_private,
    tn.created_at,
    tn.updated_at,
    tn.user_id AS created_by_user_id,
    u.full_name AS created_by_name,
    u.email AS created_by_email,
    EXISTS(
      SELECT 1 FROM task_note_shares tns 
      WHERE tns.note_id = tn.id 
      AND tns.shared_with_user_id = p_user_id
    ) AS is_shared_with_me,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'user_id', u2.id,
            'full_name', u2.full_name,
            'email', u2.email
          )
        )
        FROM task_note_shares tns2
        JOIN users u2 ON u2.id = tns2.shared_with_user_id
        WHERE tns2.note_id = tn.id
      ),
      '[]'::jsonb
    ) AS shared_with_users,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'user_id', u3.id,
            'full_name', u3.full_name,
            'email', u3.email
          )
        )
        FROM task_note_tags tnt
        JOIN users u3 ON u3.id = tnt.tagged_user_id
        WHERE tnt.note_id = tn.id
      ),
      '[]'::jsonb
    ) AS tagged_users
  FROM task_notes tn
  JOIN users u ON u.id = tn.user_id
  WHERE tn.task_id = p_task_id
    AND (
      -- User created the note
      tn.user_id = p_user_id
      -- Note is shared with user
      OR EXISTS(
        SELECT 1 FROM task_note_shares tns 
        WHERE tns.note_id = tn.id 
        AND tns.shared_with_user_id = p_user_id
      )
      -- Note is public and user has access to task
      OR (tn.is_private = false AND EXISTS(
        SELECT 1 FROM tasks t
        WHERE t.id = tn.task_id
        AND (t.assigned_to = p_user_id OR t.assigned_by = p_user_id)
      ))
    )
  ORDER BY tn.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_task_notes(UUID, UUID) TO authenticated;


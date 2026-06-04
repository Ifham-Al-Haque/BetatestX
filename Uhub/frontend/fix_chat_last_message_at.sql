-- Quick fix for chat 500 on conversations?order=last_message_at
-- Run in Supabase SQL Editor if getConversations returns 500.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON public.conversations(last_message_at DESC NULLS LAST);

-- Backfill last_message_at from latest message where null
UPDATE public.conversations c
SET last_message_at = sub.max_created
FROM (
  SELECT conversation_id, MAX(created_at) AS max_created
  FROM public.messages
  GROUP BY conversation_id
) sub
WHERE c.id = sub.conversation_id
  AND (c.last_message_at IS NULL OR c.last_message_at < sub.max_created);

-- For full chat RLS fixes, also run: fix_chat_authentication_and_rls.sql

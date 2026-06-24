-- One-time backfill: set users.last_login from activity_logs (login + session_start)
-- Run in Supabase SQL Editor if you want the column persisted in the database.
-- The User Management UI also derives this from activity_logs automatically.

UPDATE public.users u
SET
  last_login = sub.last_seen,
  updated_at = NOW()
FROM (
  SELECT
    LOWER(TRIM(user_email)) AS email_key,
    MAX(created_at) AS last_seen
  FROM public.activity_logs
  WHERE user_email IS NOT NULL
    AND TRIM(user_email) <> ''
    AND action IN ('login', 'session_start')
  GROUP BY LOWER(TRIM(user_email))
) sub
WHERE LOWER(TRIM(u.email)) = sub.email_key
  AND (u.last_login IS NULL OR u.last_login < sub.last_seen);

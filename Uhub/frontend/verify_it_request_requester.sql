-- Quick checks for IT request submit (requester_id)
-- Run in Supabase SQL Editor while logged in as the affected user, or as service role.

-- FK definition
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'it_requests_requester_id_fkey';

-- Your session (when run in SQL editor with user JWT / dashboard)
SELECT auth.uid() AS my_auth_id;

-- users row for your login (display/linking — NOT stored in requester_id)
SELECT id AS users_table_id, auth_user_id, email, role
FROM users
WHERE auth_user_id = auth.uid();

-- Past tickets use auth id in requester_id
SELECT requester_id, COUNT(*) AS cnt
FROM it_requests
GROUP BY requester_id
ORDER BY cnt DESC
LIMIT 5;

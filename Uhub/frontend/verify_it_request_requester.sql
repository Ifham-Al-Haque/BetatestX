-- Verify / fix UHub user linkage for IT request submit (requester_id → users.id)
-- Run in Supabase SQL Editor

-- 1) Confirm FK target
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'it_requests_requester_id_fkey';

-- 2) Find auth users missing a public.users row (these cannot submit IT tickets)
SELECT au.id AS auth_user_id, au.email
FROM auth.users au
LEFT JOIN public.users u ON u.auth_user_id = au.id
WHERE u.id IS NULL
ORDER BY au.email;

-- 3) Link an existing login to users (replace email)
-- INSERT INTO public.users (auth_user_id, email, role, status)
-- SELECT id, email, 'employee', 'active'
-- FROM auth.users
-- WHERE email = 'user@udrive.ae'
-- ON CONFLICT DO NOTHING;

-- 4) Or set auth_user_id on an existing users row
-- UPDATE public.users
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'user@udrive.ae')
-- WHERE email = 'user@udrive.ae' AND auth_user_id IS NULL;

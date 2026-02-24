-- Manually confirm emails for nagma@udrive.ae and hr@udrive.ae
-- This bypasses the email verification requirement

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email IN ('nagma@udrive.ae', 'hr@udrive.ae')
  AND email_confirmed_at IS NULL;

-- Verify the confirmation
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status
FROM auth.users 
WHERE email IN ('nagma@udrive.ae', 'hr@udrive.ae');

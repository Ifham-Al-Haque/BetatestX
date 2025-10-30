-- Check password and email confirmation status
-- Run this in Supabase SQL Editor

SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
    ELSE '❌ Email NOT Confirmed'
  END as email_status,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Has Password'
    ELSE '❌ No Password Set'
  END as password_status,
  created_at
FROM auth.users 
WHERE email IN ('nagma@udrive.ae', 'hr@udrive.ae')
ORDER BY email;

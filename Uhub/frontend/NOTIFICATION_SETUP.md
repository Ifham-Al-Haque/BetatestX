# UHub Notification Setup (Supabase `send-email` + optional Microsoft 365)

This guide sets up email notifications for:
- Complaint alerts
- Suggestion alerts
- IT request alerts

## 1) Environment Variables (Frontend)

Add these to your `.env` (local) and production env config:

```bash
REACT_APP_COMPLAINT_ALERT_EMAILS=humera@udrive.ae,nagma@udrive.ae
REACT_APP_SUGGESTION_ALERT_EMAILS=humera@udrive.ae,nagma@udrive.ae
REACT_APP_IT_ALERT_BASE_EMAILS=ifham@udrive.ae
```

Notes:
- Complaint and suggestion alerts go to fixed email recipients.
- IT request alerts go to `REACT_APP_IT_ALERT_BASE_EMAILS` plus users with IT roles in `users` table.

## 2) Supabase Edge Function `send-email` (Microsoft 365 SMTP)

The repo includes `Uhub/supabase/functions/send-email/index.ts`. It accepts POST JSON `{ to, subject, body }` (`body` is HTML) and sends via **SMTP** (defaults to `smtp.office365.com`).

**Deploy** (from a machine with Supabase CLI linked to your project):

```bash
cd Uhub
supabase functions deploy send-email
```

**Secrets** (Dashboard → Edge Functions → `send-email` → Secrets, or CLI):

```bash
supabase secrets set SMTP_USER="noreply@udrive.ae" SMTP_PASS="..." SMTP_FROM="noreply@udrive.ae"
# Optional overrides:
# supabase secrets set SMTP_HOST="smtp.office365.com" SMTP_PORT="587"
```

Use a **licensed mailbox** (or shared mailbox where your tenant allows SMTP AUTH). Many tenants restrict basic SMTP; if sends fail, ask IT to enable SMTP AUTH for that mailbox or use an **app-specific / documented relay** policy. (OAuth / Microsoft Graph is an alternative if SMTP is disabled.)

## 3) Supabase Edge Function Secrets (legacy / other providers)

If you instead implement OneSignal (or another ESP) inside `send-email`, align secret names with your function code. The frontend only calls `send-email`; it does not embed provider keys.

## 4) Required Runtime Path

UHub currently sends emails through:
- `src/services/emailService.js`
- `supabase.functions.invoke('send-email', { body: { to, subject, body } })`

So the `send-email` Edge Function must be deployed and reachable. If the function is missing or SMTP is misconfigured, the UI reports **failure** (no silent “success”).

## 5) Current Recipient Rules in UHub

Implemented behavior:
- Complaint alerts:
  - fixed emails from `REACT_APP_COMPLAINT_ALERT_EMAILS`
- Suggestion alerts:
  - fixed emails from `REACT_APP_SUGGESTION_ALERT_EMAILS`
- IT request alerts:
  - fixed emails from `REACT_APP_IT_ALERT_BASE_EMAILS`
  - plus role-based UHub users from `users` table with roles:
    - `it_management`
    - `it_manager`
    - `it`

Deduplication is applied by email.

## 6) 5-Minute Test Checklist

1. Create a complaint:
   - Expected: email to `humera@udrive.ae` and `nagma@udrive.ae`.
2. Create a suggestion:
   - Expected: email to `humera@udrive.ae` and `nagma@udrive.ae`.
3. Create an IT request:
   - Expected: email to `ifham@udrive.ae` and all IT-role users from `users`.
4. Verify function execution:
   - Check Supabase function logs for `send-email`.
5. Verify no duplicate recipient emails:
   - Same address should receive one message per event.

## 7) Security Checklist

- Never expose SMTP or provider keys in frontend variables (`REACT_APP_*` is public in the browser).
- Rotate any credential that was shared in screenshots or chat.
- Keep secrets only in Supabase Edge Function secrets (or your backend).
- Use separate mailboxes or keys for dev/staging/prod where possible.

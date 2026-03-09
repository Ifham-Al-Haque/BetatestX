# Notification alert and email – how to check

## 1. In-app notification alert + sound

### Quick test (no backend)
1. Open the **Notification Demo** page (if you have a route to it, e.g. `/notification-demo` or from a dev menu).
2. Click **"Test IT Request"** or **"IT Request Assigned to You"**.
3. You should see:
   - A new item in the **bell icon** dropdown (top bar).
   - A **sound** (double beep for assignment, double beep for IT request).
4. If there is no sound:
   - Check the browser tab is not muted (right‑click tab → Unmute site).
   - Check **sound is enabled**: the app uses `soundNotificationService`; if you have a settings screen for “Notification sound”, ensure it’s on.
   - Open DevTools → Console and trigger again; look for errors from the sound service.

### Real flow (assignment)
1. Log in as a user who can assign tickets (e.g. admin / IT).
2. Open **Request Inbox** and assign a ticket to **another user** (e.g. Ifham).
3. Log in as that assignee (or use another browser/incognito) and keep the app open.
4. You should get:
   - An in-app notification in the bell (e.g. “IT Request Assigned to You”).
   - The **notification sound** (double beep) when the new row is inserted into the `notifications` table and Realtime fires.
5. If the alert or sound doesn’t happen:
   - Confirm Supabase **Realtime** is enabled for the `notifications` table (Database → Replication).
   - Confirm the `create_notification` RPC (or whatever writes to `notifications`) is called and inserts a row with the assignee’s `user_id`.
   - In Console, look for `📨 Received user notification` or errors from the notification subscription.

---

## 2. Email notification

### How it’s sent
- Assignment emails are sent from **notificationService.sendITRequestAssignmentNotification** → **emailService.sendAssignmentNotification** → **emailService.sendNotification**.
- **sendNotification** calls the Supabase Edge Function **`send-email`** with `{ to, subject, body }`.
- If the Edge Function is missing or fails, the code falls back to logging only:  
  `[Email would send] To: ... | Subject: ...`  
  and no real email is sent.

### How to check
1. **Console after assigning a ticket**
   - Look for: `Assignment email sent to <email>` (success).
   - Or: `[Email would send] To: ifham@udrive.ae | Subject: ...` (Edge Function not used / failed).
   - Or: `Failed to send assignment email:` (error).

2. **Supabase Edge Function**
   - In Supabase: **Edge Functions** → ensure **`send-email`** exists and is deployed.
   - Check the function’s logs for your project when you assign a ticket; confirm it’s invoked and that it sends via your provider (e.g. Resend, SendGrid, SMTP).

3. **Inbox**
   - Assign a ticket to a user whose **email** in the `users` (or `employees`) table is correct (e.g. ifham@udrive.ae).
   - Check that inbox (and spam) for the “IT Request Assigned” email.

### If no email is received
- Confirm the assignee’s **email** is set correctly in the database (`users` or `employees`, depending on who is assigned).
- Confirm the **`send-email`** Edge Function is deployed and that its logs show a successful send.
- Confirm your email provider (Resend, etc.) is configured and that you’re not hitting rate limits or wrong “from” domain.

---

## 3. Sound types (reference)

| Type                     | Sound              |
|--------------------------|--------------------|
| IT request assigned      | Double beep        |
| New IT request / update  | Double beep (higher) |
| Task assigned            | Double beep        |
| High / urgent            | Triple beep       |
| Default                  | Single beep        |

Sound is played only when a notification is **added** (e.g. from Realtime or from the demo). The bell icon shows all notifications for the current user (filtered by `user_id` when loading from the `notifications` table).

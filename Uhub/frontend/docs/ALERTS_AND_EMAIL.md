# Uhub alert and email notification system

This document describes how alerts and email notifications work and what is needed for production.

## Current structure (in place)

### 1. In-app notifications (already working)

- **Task assignment**
  - When a task is created, `taskApi.create()` sends in-app notifications to assignees via:
    - RPC `send_task_notification` → writes to `task_notifications` (and/or `notifications`).
    - `notificationService.createNotification()` for general notifications table (if RPC is available).
  - The NotificationContext loads from both `notifications` and `task_notifications` and shows them in the UI (bell icon, etc.).

- **Other events**
  - Complaints, suggestions, IT requests, chat messages, and system/maintenance alerts use `notificationService` (createNotification, createNotificationsForUsers, createNotificationsForRole). These depend on the `create_notification` and related RPCs and the `notifications` table.

### 2. Email notifications (implemented, currently simulated)

- **Task assigned**
  - After a task is created, `TaskManagement` calls `emailService.sendTaskAssignedNotification(task, assigneeEmail, assignedByName)` for each assignee.
  - Sends one email per assignee (single or coordinated tasks).

- **Login**
  - After successful login, `Login.jsx` and `LoginEnhanced.jsx` call `emailService.sendLoginNotification(userEmail, timestamp)`.
  - Sends one email to the user (“You logged in to Uhub at …”).

- **Implementation**
  - In `emailService.js`, `sendNotification(to, subject, body)` is the core. Right now it only logs to the console (simulated). Real sending is intended to go through a backend (see below).

## Is the current structure good enough?

- **In-app:** Yes. Task assignment and other flows already create in-app notifications. No change required for basic behavior.
- **Email:** The flow (when to call, what data to pass) is in place. For **real** emails you must add a backend that actually sends mail; the client should not hold SMTP/API keys.

## Alternatives for production email

### Option A: Supabase Edge Function (recommended)

1. Create an Edge Function (e.g. `send-email`) that:
   - Accepts `{ to, subject, body }` (or similar).
   - Calls an email provider (Resend, SendGrid, Postmark, or AWS SES) using an API key stored in Supabase secrets.
   - Returns success/failure.

2. In `emailService.sendNotification()`, call the function:
   - Uncomment and use:  
     `await supabase.functions.invoke('send-email', { body: { to, subject, body } });`
   - Handle errors and optionally retry.

3. Ensure the Edge Function is allowed by your Supabase project (and, if needed, protect it with a secret header or JWT so only your app can call it).

### Option B: Backend API (Node/Next/other)

- Add a route on your backend, e.g. `POST /api/send-email`, that accepts the same payload and sends email server-side.
- From the client, call this API instead of Supabase Edge Function. Do not put email provider API keys in the frontend.

### Option C: Supabase Auth built-in email

- Supabase can send auth-related emails (magic link, reset password, confirm signup). It does **not** replace transactional emails for “task assigned” or “login notification.” Keep using one of the options above for those.

## Summary

| Alert type        | In-app                         | Email                                      |
|-------------------|--------------------------------|--------------------------------------------|
| Task assigned     | Yes (taskApi + task_notifications) | Yes (emailService, simulated until backend) |
| Login             | N/A                            | Yes (emailService, simulated until backend) |
| Other (IT, etc.)  | Yes (notificationService)      | Not implemented; add via same send-email path if needed |

The current structure is suitable; for production you only need to plug real email sending behind `emailService.sendNotification()` (Edge Function or backend API).

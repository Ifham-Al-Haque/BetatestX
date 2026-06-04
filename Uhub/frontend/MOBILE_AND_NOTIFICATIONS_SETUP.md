# Uhub — Main App & Sub-App (Udrive Fleet), Mobile Builds & Notifications

Two products from one codebase:

- **Main app — Uhub:** everything in Uhub (all panels).
- **Sub-app — Udrive Fleet:** fleet maintenance / operation department only (Android + iOS).

This covers: (1) the two **editions**, (2) building **Android/iOS** apps for testing, and (3) **in-app + email + push** notifications for fleet task assignees.

---

## 1. Two editions (one codebase)

Controlled by the build-time flag `REACT_APP_EDITION`:

| Product | Value | What it shows |
|---|---|---|
| Main app — **Uhub** | `full` (default) | The entire Uhub app |
| Sub-app — **Udrive Fleet** | `operation` | Only the **Operation/Fleet** panel + profile + chat; lands on `/operation`; branded "Udrive Fleet" |

Run / build:

```bash
# Full app
npm start                 # dev
npm run build:full        # production web build → build/

# Operation-only app
npm run start:operation   # dev
npm run build:operation   # production web build → build/
```

The Udrive Fleet edition hides all non-operation panels in the sidebar, redirects any
non-operation route back to `/operation`, and sets the app title to **Udrive Fleet**.

Implementation: `src/config/edition.js`, `src/components/EditionGuard.jsx`,
`src/components/SmartHomeRoute.jsx`, `src/components/Sidebar.jsx`.

---

## 2. Native Android / iOS (Capacitor)

We wrap the React web build in Capacitor. The app id/name switch automatically by edition
(see `capacitor.config.ts`): `ae.udrive.uhub` / `ae.udrive.uhub.fleet`.

### One-time install
```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init   # only if android/ios folders don't exist yet (uses capacitor.config.ts)
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios     # creates the iOS project (build it later on a Mac)
```

### Android (works on Windows)
Requires **Android Studio** + JDK.
```bash
npm run android:full        # build full edition + open Android Studio
npm run android:operation   # build operation edition + open Android Studio
```
In Android Studio: **Build → Generate Signed Bundle/APK** for a testable `.apk`/`.aab`.

> Tip: full and operation use different app ids, so both can be installed side-by-side.

### iOS (requires macOS + Xcode — cannot build on Windows)
On a Mac:
```bash
npm run ios:full       # or ios:operation
```
Then in Xcode set your Apple **Team/signing** and run on a device, or
Archive → distribute to **TestFlight** for testing.

If you don't have a Mac, use a cloud Mac CI (Codemagic, Ionic Appflow, or a GitHub
Actions `macos` runner) — point it at this repo and run `npm run ios:operation`.

---

## 3. Notifications for fleet task assignees

When a maintenance ticket is created/assigned (`assigned_to`), the assignee gets:
**in-app** + **email** + **push** (push only after OneSignal is configured).

Code: `notificationService.sendFleetTaskAssignmentNotification()` is called from
`fleetService.createMaintenanceTicket` / `updateMaintenanceTicket`.

### 3a. In-app (already built)
Needs the `create_notification` RPC + `notifications` table (`notification_system_setup.sql`).
The assignee's **auth id** is resolved from `users`/`employees` automatically.

### 3b. Email (SMTP — function already exists)
Function: `Uhub/supabase/functions/send-email`. Deploy + set secrets:
```bash
supabase functions deploy send-email
supabase secrets set SMTP_HOST=smtp.office365.com SMTP_PORT=587 \
  SMTP_USER=you@udrive.ae SMTP_PASS=*** SMTP_FROM=you@udrive.ae
```
Until secrets are set, emails are logged to the console (no crash).

### 3c. Push (OneSignal)
1. Create a OneSignal app → get **App ID** + **REST API key**.
2. **Web push:** set `REACT_APP_ONESIGNAL_APP_ID=<app id>` in `.env`, rebuild.
   The Web SDK auto-inits (`src/services/pushService.js`) and links the logged-in user
   via `OneSignal.login(authUserId)` (`src/components/PushIdentity.jsx`).
3. **Sending** uses the secure Edge Function `Uhub/supabase/functions/send-push`:
   ```bash
   supabase functions deploy send-push
   supabase secrets set ONESIGNAL_APP_ID=<app id> ONESIGNAL_REST_API_KEY=<rest key>
   ```
4. **Mobile push (Capacitor):** add `onesignal-cordova-plugin`, configure Firebase
   (Android, FCM) and an APNs key (iOS), then init OneSignal in the native bootstrap.
   Targeting works the same (external id = auth user id).

> The frontend never holds the REST API key — only the Edge Function does.

---

## Quick checklist
- [ ] `notification_system_setup.sql` applied (in-app)
- [ ] `send-email` deployed + SMTP secrets (email)
- [ ] OneSignal app created; `REACT_APP_ONESIGNAL_APP_ID` set (web push)
- [ ] `send-push` deployed + OneSignal secrets (sending push)
- [ ] Capacitor installed + `npx cap add android` (+ `ios` on a Mac)

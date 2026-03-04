# All in One Hub – Deployment

You can deploy the app to **Vercel**, **Netlify**, or **Firebase Hosting**. All support this Create React App (static SPA) and work well with Supabase.

## Recommendation: **Vercel**

For this stack (React SPA + Supabase), **Vercel** is the best fit:

- **React-first**: Built by the same team as Next.js; excellent support for React and SPAs.
- **Zero config**: Connect the repo, set build command and output directory, add env vars (Supabase URL/anon key, etc.), and deploy.
- **Preview deployments**: Every branch/PR gets a unique URL.
- **Global CDN** and fast builds.

Use **Netlify** if you need **commercial use on the free tier** (Vercel’s free tier is for non-commercial use). Use **Firebase Hosting** if you already use Firebase (Auth, Firestore, etc.); for Supabase-only backends, Vercel or Netlify is simpler.

---

## Option 1: Vercel (recommended)

1. Push your code to GitHub (e.g. the `all-in-one-hub` branch).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo.
3. **Root Directory**: set to `AllInOneHub/frontend` (if the repo root is the repo root) or leave as `.` if you deploy from a repo that contains only the frontend.
4. **Build & Output** (usually auto-detected for CRA):
   - Build command: `npm ci && npm run build`
   - Output directory: `build`
5. Add **Environment Variables** (e.g. `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `REACT_APP_APP_NAME=All in One Hub`).
6. Deploy.

A **`vercel.json`** is included in this folder so you can also deploy with the Vercel CLI from `AllInOneHub/frontend`:

```bash
cd AllInOneHub/frontend
npx vercel
```

---

## Option 2: Netlify

1. Connect your Git repository at [netlify.com](https://netlify.com).
2. **Build settings**:
   - Base directory: `AllInOneHub/frontend` (or leave empty if this folder is the repo root).
   - Build command: `npm ci && npm run build`
   - Publish directory: `build`
3. Add env vars in **Site settings → Environment variables**.
4. Deploy.

Optional **`netlify.toml`** in this folder (see below) configures redirects for client-side routing.

---

## Option 3: Firebase Hosting

1. Install Firebase CLI: `npm i -g firebase-tools`
2. Log in: `firebase login`
3. From the **repo root** (or from `AllInOneHub/frontend` if you run build there):
   - Build: `cd AllInOneHub/frontend && npm ci && npm run build`
   - Init hosting: `firebase init hosting` → choose `build` (or `AllInOneHub/frontend/build`) as the public directory.
4. Add a **`firebase.json`** rewrite so all routes serve `index.html` (SPA).
5. Set env vars in your CI or use a `.env.production` at build time (Firebase Hosting does not inject env vars; you need to build with them).
6. Deploy: `firebase deploy`

Firebase is a good choice if you already use Firebase Auth or Firestore; for Supabase-only, Vercel or Netlify is usually easier.

---

## Environment variables

Set these for production (names may vary by platform):

- `REACT_APP_SUPABASE_URL` – Supabase project URL  
- `REACT_APP_SUPABASE_ANON_KEY` – Supabase anon/public key  
- `REACT_APP_APP_NAME` – e.g. `All in One Hub`  
- Optional: `REACT_APP_ADMIN_EMAIL`, `REACT_APP_SUPPORT_EMAIL`

Never commit `.env` or `.env.production` with real keys; use each platform’s “Environment variables” UI or secrets.

---

## SPA routing

For client-side routing (React Router), all three hosts must serve `index.html` for every path. Included config:

- **Vercel**: `vercel.json` rewrites `/*` → `/index.html`
- **Netlify**: `netlify.toml` (or UI) redirects `/*` → `/index.html` (200)
- **Firebase**: `firebase.json` rewrites to `index.html`

Without this, refreshing or opening a deep link (e.g. `/dashboard`) returns 404.

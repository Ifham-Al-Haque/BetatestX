# All in One Hub

**All in One Hub** is a standalone unified platform for all departments. It is a separate product with its own branding and theme.

This folder contains the full frontend application.

## Quick start

1. **Install dependencies**
   ```bash
   cd AllInOneHub/frontend && npm install
   ```

2. **Configure environment**
   - Copy `env.template` or `env.example` to `.env` in the `frontend` folder.
   - Set `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, and optionally `REACT_APP_APP_NAME=All in One Hub`.

3. **Logo**
   - Add your logo as `frontend/public/logo.png` (used in header, login, PWA).  
   - Replace `frontend/public/favicon.ico` for the browser tab icon.

4. **Run locally**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Theme and branding

- **Colors**: Edit `frontend/src/config/theme.js` and, if needed, `frontend/src/context/ThemeContext.jsx` and `frontend/tailwind.config.js`. See **`frontend/THEME.md`** for details.
- **Tailwind**: Theme utilities use the `hub-*` namespace (e.g. `bg-hub-primary`, `text-hub-accent-primary`).

## Deployment

Deploy to **Vercel** (recommended), **Netlify**, or **Firebase Hosting**. Full comparison and steps are in **`frontend/DEPLOYMENT.md`**.

- **Vercel**: Use the included `frontend/vercel.json`; connect the repo and set env vars.
- **Netlify**: Use `frontend/netlify.toml` when the site root is `AllInOneHub/frontend`.

## Branch

This product is developed on the **`all-in-one-hub`** branch. The main Uhub/Udrive app remains on `main`.

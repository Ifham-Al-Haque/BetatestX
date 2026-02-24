# All in One Hub

**All in One Hub** is a standalone product (not part of Udrive). It is your own personalized hub, built from the same working codebase as Uhub.

This folder contains the full frontend application. The code was copied from the working Uhub frontend so you can evolve it independently for the All in One Hub product.

## Quick start

1. **Install dependencies**
   ```bash
   cd AllInOneHub/frontend && npm install
   ```

2. **Configure environment**
   - Copy `env.template` or `env.example` to `.env` in the `frontend` folder.
   - Fill in your Supabase (or other) credentials.

3. **Run locally**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Deployment (e.g. Vercel)

- **Root build**: If this repo root is deployed, point the build to `AllInOneHub/frontend` (e.g. set `buildCommand` to `cd AllInOneHub/frontend && npm ci && npm run build` and `outputDirectory` to `AllInOneHub/frontend/build`).
- **Monorepo**: You can also deploy only the `AllInOneHub/frontend` directory as a separate project.

## Branch

This product lives on the **`all-in-one-hub`** Git branch. The main Uhub/Udrive app remains on `main`.

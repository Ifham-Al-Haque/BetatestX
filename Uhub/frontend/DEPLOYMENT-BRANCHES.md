# UHub vs All-in-One Hub — Deployment & Branches

## Two separate products

- **UHub** — Deploys from this repo’s **main** (or your chosen Uhub production) branch. Hosted on **Uhub’s Vercel project**.
- **All-in-One Hub** — A **different product**. It must **not** be deployed by the Uhub Vercel project. Use **separate hosting** (e.g. a separate Vercel project or another host) for the All-in-One branch.

---

## 1. Uhub Vercel project (this app only)

- **One Vercel project** = **one product** (Uhub).
- Connect the repo to **one** Vercel project and use it **only for Uhub**.
- Deploy **only** the Uhub branch (e.g. `main`). The All-in-One branch must **not** trigger builds or deployments on this project.

### In Vercel (Uhub project)

1. **Production branch**  
   **Settings → Git → Production Branch**  
   Set to the branch you use for Uhub (e.g. `main`). Only this branch will update the production URL.

2. **Stop other branches from building (recommended)**  
   **Settings → Git → Ignored Build Step**  
   Use “Override” and set the build command to a script that exits with `0` only for the Uhub branch and `1` for others, so Vercel skips building (and deploying) other branches (e.g. the All-in-One branch).

   Example (bash) — build only when branch is `main`:

   ```bash
   if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then exit 0; else exit 1; fi
   ```

   Replace `main` with your actual Uhub production branch name.

   Result: pushes to the All-in-One branch (or any other branch) will **not** deploy or affect the Uhub Vercel project.

3. **Root Directory**  
   - If the repo root is **IT-Project** (and the app lives in `Uhub/frontend`): leave **Root Directory** empty so the repo-root `vercel.json` is used (it runs `cd Uhub/frontend` and builds from there).  
   - If you prefer to build from the app folder: set **Root Directory** to `Uhub/frontend` and use the default Build Command `npm run build` and Output Directory `build` (you can remove or adjust the repo-root `vercel.json` if you switch to this).

---

## 2. All-in-One Hub (separate hosting)

- **Do not** connect the All-in-One branch to the **Uhub** Vercel project.
- Create a **separate** deployment:
  - **Option A:** New Vercel project linked to the **same repo**, with **Branch** set to the All-in-One branch (e.g. `all-in-one`), and **Root Directory** set to the app folder for that product (if different).
  - **Option B:** A different repo or host (e.g. Netlify, another Vercel team) for the All-in-One code.

That way, Uhub stays on Uhub’s Vercel project and All-in-One has its own hosting and URL.

---

## 3. If Uhub deployment is failing on Vercel

- **Branch:** Ensure the Uhub Vercel project is building the **Uhub** branch (e.g. `main`), not the All-in-One branch (see Ignored Build Step above).
- **Root / build:** If repo root is IT-Project, use the existing repo-root `vercel.json` (no Root Directory) **or** set Root Directory to `Uhub/frontend` and default build/output.
- **Env vars:** In the Uhub Vercel project, set all required `REACT_APP_*` (and any other) env vars (see `QUICK-DEPLOYMENT-GUIDE.md`).
- **Logs:** Check the failing build logs in the Vercel dashboard for the exact error (e.g. missing env, wrong path, or install/build failure).

---

## Summary

| Product        | Branch (example) | Vercel / hosting                          |
|----------------|------------------|-------------------------------------------|
| **Uhub**       | `main`           | **One** Vercel project, deploy only `main` |
| **All-in-One** | e.g. `all-in-one`| **Separate** Vercel project or other host  |

The new All-in-One branch should **not** be deployed by the Uhub Vercel project; use separate hosting for All-in-One Hub.

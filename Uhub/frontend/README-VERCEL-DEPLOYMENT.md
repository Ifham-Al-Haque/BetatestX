# UHub Vercel Deployment Guide

This guide will help you deploy UHub to Vercel using the Betatest2 repository.

## Prerequisites

- [Vercel account](https://vercel.com)
- [GitHub account](https://github.com)
- Supabase project with all tables set up
- Node.js 18+ installed locally

## Step 1: Create Betatest2 Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `Betatest2`
3. Make it **private** (recommended for production)
4. Don't initialize with README, .gitignore, or license

## Step 2: Prepare Your Code

### 2.1 Copy Files to Betatest2

Copy these files from your current Uhub project to the new Betatest2 repository:

```
Betatest2/
├── public/
├── src/
├── package.json
├── package-lock.json
├── tailwind.config.js
├── postcss.config.js
├── vercel-production.json (rename to vercel.json)
├── env.production.template
├── .gitignore.vercel (rename to .gitignore)
└── README.md
```

### 2.2 Update Configuration Files

1. **Rename files:**
   - `vercel-production.json` → `vercel.json`
   - `.gitignore.vercel` → `.gitignore`
   - `env.production.template` → `.env.local`

2. **Update package.json:**
   ```json
   {
     "name": "uhub-production",
     "version": "1.0.0",
     "homepage": "https://your-app-name.vercel.app"
   }
   ```

## Step 3: Set Up Environment Variables

### 3.1 Get Your Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy your:
   - Project URL
   - Anon public key

### 3.2 Update .env.local

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://qtugowosurgecytgswuo.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_actual_anon_key_here

# App Configuration
REACT_APP_APP_NAME=UHub
REACT_APP_ADMIN_EMAIL=ifham@udrive.ae
REACT_APP_ENVIRONMENT=production

# Feature Flags
REACT_APP_ENABLE_CHAT=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false
```

## Step 4: Deploy to Vercel

### 4.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your `Betatest2` repository
4. Vercel will auto-detect it's a Create React App

### 4.2 Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset:** Create React App
- **Root Directory:** `./` (leave empty)
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm ci`

### 4.3 Set Environment Variables in Vercel

1. In your Vercel project settings
2. Go to "Environment Variables"
3. Add these variables:

```
REACT_APP_SUPABASE_URL = https://qtugowosurgecytgswuo.supabase.co
REACT_APP_SUPABASE_ANON_KEY = your_actual_anon_key
REACT_APP_APP_NAME = UHub
REACT_APP_ADMIN_EMAIL = ifham@udrive.ae
REACT_APP_ENVIRONMENT = production
REACT_APP_ENABLE_CHAT = true
REACT_APP_ENABLE_ANALYTICS = true
REACT_APP_ENABLE_DEBUG = false
```

### 4.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project-name.vercel.app`

## Step 5: Configure Supabase for Production

### 5.1 Update Supabase Settings

1. Go to Supabase Dashboard → Settings → API
2. Add your Vercel domain to allowed origins:
   ```
   https://your-project-name.vercel.app
   https://your-project-name-git-main-username.vercel.app
   ```

### 5.2 Update RLS Policies

Make sure your RLS policies work with the production domain:

```sql
-- Update any CORS-related policies if needed
-- Most policies should work as-is since they use auth.uid()
```

## Step 6: Test Your Deployment

### 6.1 Basic Functionality

- [ ] App loads without errors
- [ ] Authentication works
- [ ] All pages are accessible
- [ ] Database connections work
- [ ] Chat system works (if enabled)

### 6.2 Performance Check

- [ ] Page load times are acceptable
- [ ] Images and assets load properly
- [ ] No console errors
- [ ] Mobile responsiveness works

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain

1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 7.2 Update Supabase Settings

Add your custom domain to Supabase allowed origins.

## Troubleshooting

### Common Issues

1. **Build Fails:**
   - Check Node.js version (use 18+)
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Environment Variables Not Working:**
   - Ensure variables start with `REACT_APP_`
   - Check Vercel environment variable settings
   - Redeploy after adding variables

3. **Supabase Connection Issues:**
   - Verify Supabase URL and key
   - Check CORS settings in Supabase
   - Ensure RLS policies are correct

4. **Routing Issues:**
   - Verify vercel.json configuration
   - Check that all routes redirect to index.html

### Debug Commands

```bash
# Test build locally
npm run build
npm install -g serve
serve -s build

# Check environment variables
echo $REACT_APP_SUPABASE_URL
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use Vercel's environment variable system
   - Rotate keys regularly

2. **Supabase Security:**
   - Review RLS policies
   - Limit API access
   - Monitor usage

3. **Vercel Security:**
   - Enable Vercel Security headers
   - Use HTTPS only
   - Monitor deployments

## Monitoring

1. **Vercel Analytics:**
   - Enable Vercel Analytics
   - Monitor performance metrics

2. **Supabase Monitoring:**
   - Check Supabase dashboard
   - Monitor API usage
   - Review logs

## Updates and Maintenance

1. **Code Updates:**
   - Push to main branch
   - Vercel auto-deploys
   - Test in preview deployments first

2. **Database Updates:**
   - Run SQL scripts in Supabase
   - Test in staging environment first

3. **Dependencies:**
   - Keep dependencies updated
   - Test updates in development first

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Review browser console errors
4. Test locally with production environment variables

Your UHub application should now be successfully deployed to Vercel! 🚀

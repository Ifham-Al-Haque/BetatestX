@echo off
echo 🚨 CRITICAL SECURITY FIX - Removing .env from git history
echo.

echo Step 1: Removing .env from git history...
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

echo.
echo Step 2: Cleaning up...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin

echo.
echo Step 3: Garbage collection...
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo Step 4: Force pushing to remote...
git push origin --force --all

echo.
echo ✅ Git history cleaned! The .env file has been removed from all commits.
echo.
echo ⚠️  IMPORTANT: You must now rotate your Supabase API key!
echo    1. Go to Supabase Dashboard
echo    2. Settings → API → Reset API Key
echo    3. Update Vercel environment variables
echo    4. Redeploy your application
echo.
pause

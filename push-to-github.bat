@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: lazy supabase client to prevent prerender error"
git push origin main
echo.
echo Done! Vercel will redeploy automatically.
pause

@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: warm cream theme matching Diego's Typeform branding"
git push origin main
echo.
echo Done! Vercel will redeploy automatically.
pause

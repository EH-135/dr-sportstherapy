@echo off
cd /d "%~dp0"
git init
git remote remove origin 2>nul
git remote add origin https://github.com/EH-135/dr-sportstherapy.git
git add .
git commit -m "feat: complete standalone quiz + client portal"
git branch -M main
git push -u origin main --force
echo.
echo Done! Now go to vercel.com and import the dr-sportstherapy repo.
pause

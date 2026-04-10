@echo off
title GitHub Auto-Uploader
color 0B

echo [+] Initializing local Git repository...
git init

echo.
echo [+] Staging all Virtual Mouse files...
git add .

echo.
echo [+] Creating initial commit...
git commit -m "🚀 Initial Release: AI Virtual Mouse (Phases 1 to 4 Complete)"

echo.
echo [+] Setting branch to 'main'...
git branch -M main

echo.
echo [+] Linking to GitHub Repository: krishivkatariya/virtual-mouce
git remote remove origin 2>nul
git remote add origin https://github.com/krishivkatariya/virtual-mouce.git

echo.
echo [+] 📡 Pushing all code to GitHub (Overwriting remote mismatch)...
git push -u origin main --force

echo.
echo ==========================================================
echo [SUCCESS] Your code is now live on GitHub!
echo ==========================================================
pause

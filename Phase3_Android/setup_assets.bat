@echo off
echo [+] Copying Phase2_Web components to Android App Assets...
mkdir "app\src\main\assets" 2>nul
xcopy /E /I /Y "..\Phase2_Web" "app\src\main\assets"
echo [+] Web Hub Bridge successfully built into Native Android!
pause

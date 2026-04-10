@echo off
title AI Mouse Starter (Python 3.6 Legacy Edition)
color 0B

echo [+] Setting up the AI Mouse for older Python versions...
cd /d "%~dp0"

IF NOT EXIST "venv" (
    echo [+] Creating local isolated sandbox...
    python -m venv venv
)

echo [+] Forcing ancient library versions compatible with Python 3.6...
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install opencv-python==4.5.3.56 pyautogui
venv\Scripts\python.exe -m pip install mediapipe==0.8.9.1 dataclasses

echo.
echo [+] Starting the Advanced Virtual Mouse!
venv\Scripts\python.exe virtual_mouse.py
pause

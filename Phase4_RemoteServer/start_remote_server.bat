@echo off
title AI Remote Socket Server
echo [+] Installing Core Dependency...
pip install pyautogui
echo [+] Booting Remote AI Receiver...
python remote_mouse_server.py
pause

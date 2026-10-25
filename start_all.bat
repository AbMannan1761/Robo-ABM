@echo off
title Stonic JARVIS - Master Launcher
echo ========================================================
echo    STARTING STONIC JARVIS SCI-FI DESKTOP SYSTEM
echo ========================================================
echo Starting Backend Server on port 5800...
start "Stonic-Backend" "%~dp0start_server.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend HUD on port 5173...
start "Stonic-Frontend" "%~dp0start_client.bat"

timeout /t 3 /nobreak >nul

echo Opening Stonic JARVIS Interface in default browser...
start http://localhost:5173

echo.
echo All systems initialized. Press any key to exit this launcher window.
pause >nul

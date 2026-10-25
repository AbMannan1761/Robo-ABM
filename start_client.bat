@echo off
title Stonic JARVIS - Frontend Sci-Fi HUD
cd /d "%~dp0client"
echo ========================================================
echo    STONIC JARVIS - FRONTEND INTERFACE (PORT 5173)
echo ========================================================
npm run dev -- --host
pause

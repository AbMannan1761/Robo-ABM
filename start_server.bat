@echo off
title Stonic JARVIS - Backend Core Engine
cd /d "%~dp0server"
echo ========================================================
echo    STONIC JARVIS - BACKEND NEURAL ENGINE (PORT 5800)
echo ========================================================
python -m uvicorn main:app --host 127.0.0.1 --port 5800 --reload
pause

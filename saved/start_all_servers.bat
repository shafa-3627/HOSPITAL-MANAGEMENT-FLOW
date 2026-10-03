@echo off
title YODHA 2.0 - Server Launcher
echo ====================================================
echo Starting YODHA 2.0 - Predictive Hospital Flow System
echo ====================================================

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "YODHA Backend" cmd /k "cd /d D:\yodha\backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Vite Frontend on http://127.0.0.1:5173 ...
start "YODHA Frontend" cmd /k "cd /d D:\yodha\frontend && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

echo ====================================================
echo YODHA 2.0 is now RUNNING!
echo Web App: http://127.0.0.1:5173
echo API Docs: http://127.0.0.1:8000/docs
echo ====================================================
pause

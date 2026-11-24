@echo off
title CodeMatch - Full Stack Development Server
echo ========================================================
echo           CodeMatch Platform - Local Launcher
echo ========================================================
echo.

echo Starting FastAPI Backend on port 8000...
start "CodeMatch Backend" cmd /k "cd backend && %USERPROFILE%\AppData\Local\Python\bin\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting React + Vite Frontend on port 5173...
start "CodeMatch Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  Backend API:  http://localhost:8000
echo  API Docs:     http://localhost:8000/api/docs
echo  Frontend UI:  http://localhost:5173
echo ========================================================
echo.
pause

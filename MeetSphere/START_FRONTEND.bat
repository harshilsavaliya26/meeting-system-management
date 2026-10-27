@echo off
setlocal
cd /d "%~dp0frontend"
title MeetSphere - Angular Frontend

echo ======================================================
echo            MeetSphere Frontend Startup
echo ======================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall Node.js LTS and reopen this window.
  pause
  exit /b 1
)
echo [INFO] Node: & node --version
echo [INFO] npm: & npm --version
echo.
if not exist node_modules (
  echo [INFO] Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check internet access and package.json.
    pause
    exit /b 1
  )
)
echo [INFO] Starting frontend at http://localhost:4200
echo [INFO] Keep this window OPEN while using MeetSphere.
echo.
call npm start
if errorlevel 1 (
  echo [ERROR] Angular frontend stopped. Read the error above.
  pause
  exit /b 1
)
pause

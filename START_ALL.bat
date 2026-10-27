@echo off
setlocal
title MeetSphere - All Services Launcher

echo ======================================================
echo          MeetSphere Complete System Launcher
echo ======================================================
echo.
echo [1/3] Starting ASP.NET Core Backend (Port 5001)...
start "MeetSphere Backend API" cmd /k "cd /d ""%~dp0MeetSphere\backend\MeetSphere.Api"" && dotnet run --urls http://localhost:5001"

echo [2/3] Starting Angular Frontend (Port 4200)...
start "MeetSphere Frontend" cmd /k "cd /d ""%~dp0MeetSphere\frontend"" && npm start"

echo.
echo [3/3] Opening MeetSphere in browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:4200

echo.
echo ======================================================
echo  MeetSphere is launching!
echo  Backend API:  http://localhost:5001/api/health
echo  Frontend Web: http://localhost:4200
echo  Database:     MySQL (meetsphere_db)
echo.
echo  Admin Setup Key: MEETSPHERE-ADMIN-2026
echo ======================================================
echo.
pause

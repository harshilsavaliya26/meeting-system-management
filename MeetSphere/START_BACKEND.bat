@echo off
setlocal EnableExtensions
cd /d "%~dp0backend\MeetSphere.Api"
title MeetSphere - .NET API

echo ======================================================
echo             MeetSphere Backend Startup
echo ======================================================
echo.
where dotnet >nul 2>nul
if errorlevel 1 (
  echo [ERROR] dotnet was not found.
  echo Install the .NET 8 SDK from:
  echo https://dotnet.microsoft.com/en-us/download/dotnet/8.0
  echo After installation, close and reopen this window and retry.
  pause
  exit /b 1
)
echo [INFO] Installed .NET SDK:
dotnet --list-sdks
echo.

echo [INFO] Checking port 5001...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":5001 .*LISTENING"') do (
  echo [INFO] Stopping old API process PID %%P so the latest WorkspaceController is loaded...
  taskkill /PID %%P /F >nul 2>nul
)

echo [INFO] Cleaning old .NET build output...
if exist bin rmdir /s /q bin
if exist obj rmdir /s /q obj

echo [INFO] Restoring backend packages. This may take a few minutes...
dotnet restore
if errorlevel 1 (
  echo.
  echo [ERROR] dotnet restore failed. Check internet access and the SDK installation.
  pause
  exit /b 1
)
echo.
echo [INFO] Starting API at http://localhost:5001
 echo [INFO] Keep this window OPEN while using MeetSphere.
echo [INFO] After startup, test: http://localhost:5001/api/health
echo.
dotnet run --no-launch-profile --urls "http://localhost:5001"
set API_EXIT=%ERRORLEVEL%
echo.
echo [ERROR] The API process stopped (exit code %API_EXIT%).
echo Read the error shown above. Common causes are missing .NET SDK,
echo port 5001 already in use, or a MySQL connection/configuration issue.
echo.
pause
exit /b %API_EXIT%

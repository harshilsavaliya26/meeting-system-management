$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Api = Join-Path $Root 'backend\MeetSphere.Api'
$Web = Join-Path $Root 'frontend'

Write-Host 'MeetSphere Plus V16 startup helper' -ForegroundColor Cyan
Write-Host 'Make sure XAMPP MySQL is running and meetsphere_db exists.' -ForegroundColor Yellow

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
  Write-Host 'ERROR: .NET SDK not found. Install the .NET SDK required by the project.' -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host 'ERROR: Node.js/npm not found. Install Node.js LTS first.' -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}
if (-not (Test-Path (Join-Path $Api 'MeetSphere.Api.csproj'))) {
  Write-Host "ERROR: Backend project not found at $Api" -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}
if (-not (Test-Path (Join-Path $Web 'package.json'))) {
  Write-Host "ERROR: Frontend project not found at $Web" -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}

$port = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue
if ($port) {
  Write-Host 'Port 5001 is already in use. Close the old MeetSphere backend window or stop that process, then run this script again.' -ForegroundColor Red
  Read-Host 'Press Enter to close'; exit 1
}

$nodeModules = Join-Path $Web 'node_modules'
if (-not (Test-Path $nodeModules)) {
  Write-Host 'Installing frontend dependencies for first run...' -ForegroundColor Yellow
  Push-Location $Web
  npm install
  $installCode = $LASTEXITCODE
  Pop-Location
  if ($installCode -ne 0) { Write-Host 'npm install failed. Keep this window open and review the error.' -ForegroundColor Red; Read-Host 'Press Enter to close'; exit $installCode }
}

Start-Process powershell.exe -ArgumentList '-NoExit','-Command',("Set-Location '{0}'; dotnet restore; if (`$LASTEXITCODE -eq 0) {{ dotnet run --urls http://localhost:5001 }}" -f $Api)
Start-Sleep -Seconds 4
try {
  $health = Invoke-RestMethod -Uri 'http://localhost:5001/api/health' -TimeoutSec 3
  Write-Host "Backend health: $($health.status)" -ForegroundColor Green
  try { $dbHealth = Invoke-RestMethod -Uri 'http://localhost:5001/api/health/database' -TimeoutSec 3; Write-Host "Database health: $($dbHealth.database)" -ForegroundColor Green } catch { Write-Host 'Database health failed. Check XAMPP MySQL and connection settings in backend window.' -ForegroundColor Red }
} catch {
  Write-Host 'Backend health check did not respond yet. Keep the backend window open and inspect its error output; Contacts/API calls will fail until the API is running.' -ForegroundColor Red
}
Start-Process powershell.exe -ArgumentList '-NoExit','-Command',("Set-Location '{0}'; npm start" -f $Web)
Start-Sleep -Seconds 3
Start-Process 'http://localhost:4200'
Write-Host 'Opened backend and frontend in separate PowerShell windows.' -ForegroundColor Green
Write-Host 'If Contacts shows HTTP status 0, check the backend window: the API may have stopped, the database may be unavailable, or the browser origin/port may not match CORS.' -ForegroundColor Yellow
Read-Host 'Press Enter to close this helper'

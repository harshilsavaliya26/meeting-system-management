$ErrorActionPreference = 'Continue'
Write-Host 'MeetSphere V16 - connection diagnostic' -ForegroundColor Cyan
foreach ($url in @('http://localhost:5001/api/health','http://localhost:5001/api/health/database')) {
  Write-Host "Checking $url" -ForegroundColor Yellow
  try {
    $result = Invoke-RestMethod -Uri $url -TimeoutSec 5
    $result | ConvertTo-Json -Depth 4
  } catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Make sure the backend is running and XAMPP MySQL is started.' -ForegroundColor Yellow
  }
}
Write-Host 'If health works but Contacts fails, open browser DevTools > Network and inspect /api/workspace/contacts response and backend window.' -ForegroundColor Cyan
Read-Host 'Press Enter to close'

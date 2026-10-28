# Kill processes on ports 3000 and 3001
Write-Host "`n🔍 Checking ports..." -ForegroundColor Cyan

# Check port 3001 (Worker)
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($port3001) {
    Write-Host "❌ Port 3001 in use (PID: $port3001)" -ForegroundColor Red
    Stop-Process -Id $port3001 -Force
    Write-Host "✅ Killed process on port 3001" -ForegroundColor Green
} else {
    Write-Host "✅ Port 3001 is free" -ForegroundColor Green
}

# Check port 3000 (Web)
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($port3000) {
    Write-Host "❌ Port 3000 in use (PID: $port3000)" -ForegroundColor Red
    Stop-Process -Id $port3000 -Force
    Write-Host "✅ Killed process on port 3000" -ForegroundColor Green
} else {
    Write-Host "✅ Port 3000 is free" -ForegroundColor Green
}

Write-Host "`n✅ All ports are now free!`n" -ForegroundColor Green
Start-Sleep -Seconds 2


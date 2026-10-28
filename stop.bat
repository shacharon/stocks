@echo off
echo.
echo ===================================
echo   EOD Stock Analyzer - Stop All
echo ===================================
echo.
echo Stopping all services...
echo.

cd /d C:\dev\stocks

echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Stopping Docker containers...
pnpm dev:down

echo.
echo Waiting for ports to free up...
timeout /t 3 /nobreak >nul

echo.
echo ✅ All services stopped!
echo.
pause


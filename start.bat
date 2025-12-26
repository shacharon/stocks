@echo off
echo.
echo ===================================
echo   EOD Stock Analyzer - Quick Start
echo ===================================
echo.
echo Starting services...
echo.
echo This will open 3 terminal windows:
echo   1. Docker (PostgreSQL + Redis)
echo   2. Worker API (Backend)
echo   3. Web UI (Frontend)
echo.
echo Press any key to continue...
pause > nul

cd /d C:\dev\stocks

echo.
echo [1/3] Starting Docker services...
start "Stock Analyzer - Docker" cmd /k "pnpm dev:up"
timeout /t 5 /nobreak > nul

echo [2/3] Starting Worker API...
start "Stock Analyzer - Worker API" cmd /k "pnpm -C apps/worker dev"
timeout /t 5 /nobreak > nul

echo [3/3] Starting Web UI...
start "Stock Analyzer - Web UI" cmd /k "pnpm -C apps/web dev"

echo.
echo ===================================
echo   All services are starting!
echo ===================================
echo.
echo Wait 10-15 seconds, then open:
echo   http://localhost:3000
echo.
echo Press any key to exit this window...
pause > nul


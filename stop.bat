@echo off
echo.
echo ===================================
echo   EOD Stock Analyzer - Stop All
echo ===================================
echo.
echo Stopping all services...
echo.

cd /d C:\dev\stocks

echo Stopping Docker containers...
pnpm dev:down

echo.
echo All services stopped!
echo.
echo Note: You may need to manually close the terminal windows.
echo.
pause


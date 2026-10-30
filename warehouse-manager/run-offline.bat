@echo off
REM Warehouse Manager — Windows Batch Launcher
REM If running on Windows, starts MySQL, backend server, and frontend client.

echo ==========================================================
echo    WAREHOUSE MANAGER — OFFLINE LOCAL LAUNCHER
echo ==========================================================
echo.

cd /d %~dp0

echo [1/3] Starting backend server (port 3001)...
start "Warehouse Server" cmd /k "cd server && npm run dev"

echo [2/3] Starting frontend client (port 5173)...
start "Warehouse Client" cmd /k "cd client && npm run dev"

echo [3/3] Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Application started at http://localhost:5173
pause

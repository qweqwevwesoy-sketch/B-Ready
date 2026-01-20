@echo off
echo ============================================
echo    QUICK GLOBAL START - No User Input
echo ============================================
echo.
echo This starts global access automatically
echo (no pauses, no user input required)
echo.

REM Quick check
if not exist "package.json" (
    echo ❌ package.json not found!
    exit /b 1
)

echo 🚀 Starting servers...
cd /d "%~dp0server"
start "Socket.io Server" cmd /k "set PORT=3003 && npm run dev"
cd /d "%~dp0"

timeout /t 3 /nobreak >nul

start "Next.js Frontend" cmd /k "set PORT=3002 && set NEXT_TELEMETRY_DISABLED=1 && npm run dev"

timeout /t 3 /nobreak >nul

echo 🌐 Starting WebSocket tunnel first...
start "WebSocket Tunnel" cmd /k "ngrok http 3003"
timeout /t 12 /nobreak >nul

echo 🌐 Starting frontend tunnel...
start "Frontend Tunnel" cmd /k "ngrok http 3002"

echo ✅ Done! Check the opened windows for URLs.
timeout /t 2 /nobreak >nul

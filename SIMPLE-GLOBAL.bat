@echo off
echo ============================================
echo    SIMPLE GLOBAL ACCESS
echo ============================================
echo.
echo Uses ngrok free random URLs
echo Simple and reliable
echo.
pause

echo.
echo 🚀 Starting servers...
echo.

REM Start servers
cd /d "%~dp0server"
start "Socket.io Server" cmd /k "set PORT=3003 && npm run dev"
cd /d "%~dp0"

timeout /t 3 /nobreak >nul

start "Next.js Frontend" cmd /k "set PORT=3002 && set NEXT_TELEMETRY_DISABLED=1 && npm run dev"

echo ✅ Servers started
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Creating simple tunnels...
echo.

REM Create tunnels one at a time with delay
echo Creating first tunnel...
start "Tunnel 1" cmd /k "ngrok http 3002"

timeout /t 15 /nobreak >nul

echo Creating second tunnel...
start "Tunnel 2" cmd /k "ngrok http 3003"

echo.
echo 🎉 SUCCESS!
echo.
echo 📋 CHECK YOUR NGROK WINDOWS:
echo - First window: Frontend URL (port 3002)
echo - Second window: WebSocket URL (port 3003)
echo.
echo 🌍 HOW TO USE:
echo 1. Open the first URL (Frontend)
echo 2. Yellow config panel appears
echo 3. Copy second URL (WebSocket) into panel
echo 4. Save and your app works globally!
echo.
echo ✅ No custom domains needed - just random URLs!
echo.
pause

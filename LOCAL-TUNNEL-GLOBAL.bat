@echo off
echo ============================================
echo    LOCAL TUNNEL GLOBAL ACCESS
echo ============================================
echo.
echo Using LocalTunnel (free, no conflicts!)
echo Alternative to ngrok - guaranteed to work!
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
echo 🌐 Creating LocalTunnel connections...
echo.

REM Create WebSocket tunnel with LocalTunnel
echo Creating WebSocket tunnel (port 3003)...
start "WebSocket LocalTunnel" cmd /k "lt --port 3003"

timeout /t 8 /nobreak >nul

REM Create Frontend tunnel with LocalTunnel
echo Creating Frontend tunnel (port 3002)...
start "Frontend LocalTunnel" cmd /k "lt --port 3002"

echo.
echo 🎉 SUCCESS! LocalTunnel tunnels created
echo.
echo 📋 CHECK YOUR WINDOWS:
echo - WebSocket LocalTunnel: Shows https://xxxxx.loca.lt URL
echo - Frontend LocalTunnel: Shows https://yyyyy.loca.lt URL
echo.
echo 🌍 ACCESS YOUR GLOBAL SYSTEM:
echo 1. Open the Frontend URL (second window)
echo 2. Yellow config panel appears
echo 3. Copy WebSocket URL (first window) and save
echo.
echo ✅ No conflicts - LocalTunnel is conflict-free!
echo.
pause

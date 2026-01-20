@echo off
echo ============================================
echo    B-READY Global Access - SAFE MODE
echo ============================================
echo.
echo SAFE MODE: Uses different ports to avoid conflicts
echo Frontend: Port 3002 | WebSocket: Port 3003
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    echo Make sure you're in the b-ready-nextjs folder
    pause
    exit /b 1
)

echo ✅ Starting SAFE MODE setup...
echo.
echo 🚀 Starting B-READY servers on SAFE ports...

REM Start Socket.io server on port 3003
echo 🚀 Starting Socket.io server (port 3003)...
cd /d "%~dp0server"
start "B-READY Socket.io Server - SAFE" cmd /k "set PORT=3003 && npm run dev"

REM Wait for server to start
cd /d "%~dp0"
timeout /t 5 /nobreak >nul

REM Start Next.js frontend on port 3002
echo 🚀 Starting Next.js frontend (port 3002)...
start "B-READY Frontend - SAFE" cmd /k "set PORT=3002 && set NEXT_TELEMETRY_DISABLED=1 && npm run dev"

REM Wait for servers
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Creating SAFE tunnels (no conflicts possible)...

REM Create ngrok tunnel for frontend (port 3002)
echo 🚀 Creating tunnel for frontend (port 3002)...
start "Ngrok Frontend - SAFE" cmd /k "ngrok http 3002"

REM Wait longer for first tunnel to establish
timeout /t 8 /nobreak >nul

REM Create ngrok tunnel for WebSocket server (port 3003)
echo 🚀 Creating tunnel for WebSocket server (port 3003)...
start "Ngrok WebSocket - SAFE" cmd /k "ngrok http 3003"

REM Wait for tunnels
timeout /t 5 /nobreak >nul

echo.
echo ✅ SAFE MODE Setup Complete!
echo.
echo 🌍 Access URLs (check ngrok windows):
echo - Frontend: https://xxxxx.ngrok.io (port 3002)
echo - WebSocket: https://yyyyy.ngrok.io (port 3003)
echo.
echo 🔧 WebSocket Configuration:
echo 1. Open the frontend URL
echo 2. Use the yellow config panel to set WebSocket URL
echo 3. The system will work perfectly!
echo.
echo 💡 SAFE MODE Benefits:
echo - Uses ports 3002/3003 (avoids conflicts)
echo - Fresh servers every time
echo - No interference from other processes
echo.
pause

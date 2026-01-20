@echo off
echo ============================================
echo    B-READY Emergency Reporting System
echo    (Global Access with Ngrok)
echo ============================================
echo.
echo This will start B-READY with GLOBAL internet access
echo using ngrok tunnels for both frontend and WebSocket server.
echo.
echo You will get two ngrok URLs:
echo - Frontend: https://xxxxx.ngrok.io
echo - WebSocket: https://xxxxx.ngrok.io (same domain, different port)
echo.
pause

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    echo Make sure you're in the b-ready-nextjs folder
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing main dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Install server dependencies if needed
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ Failed to install server dependencies
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo Starting B-READY with Global Access
echo ============================================
echo.
echo 🚀 Starting servers and creating ngrok tunnels...
echo.

REM Run aggressive cleanup to prevent conflicts and ensure fresh servers
echo 🔄 Running complete system cleanup...
call cleanup-ngrok.bat >nul 2>&1

REM Kill any existing Node.js processes that might be serving old content
echo 🔄 Killing any existing Node.js development servers...
taskkill /F /FI "IMAGENAME eq node.exe" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq B-READY Frontend*" >nul 2>&1
timeout /t 3 /nobreak >nul
echo Cleanup complete.

REM Start Socket.io server in new window
echo 🚀 Starting Socket.io server...
start "B-READY Socket.io Server" cmd /k "cd /d %~dp0server && npm run dev"

REM Wait for Socket.io server to start
timeout /t 5 /nobreak >nul

REM Start Next.js frontend in new window (with HMR disabled for global access)
echo 🚀 Starting Next.js frontend...
start "B-READY Frontend" cmd /k "cd /d %~dp0 && set NEXT_TELEMETRY_DISABLED=1 && set NEXT_PUBLIC_DISABLE_HMR=true && npm run dev"

REM Wait for both servers to start
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Creating ngrok tunnels for global access...
echo.

REM Create ngrok tunnel for frontend (port 3000)
echo 🚀 Creating tunnel for frontend (port 3000)...
start "Ngrok Frontend Tunnel" cmd /k "ngrok http 3000"

REM Wait a moment
timeout /t 5 /nobreak >nul

REM Create ngrok tunnel for WebSocket server (port 3001) with a delay to avoid conflicts
echo 🚀 Creating tunnel for WebSocket server (port 3001)...
start "Ngrok WebSocket Tunnel" cmd /k "timeout /t 10 /nobreak >nul && ngrok http 3001"

REM Wait for tunnels to establish
timeout /t 5 /nobreak >nul

echo.
echo ✅ Global Access Setup Complete!
echo.
echo 🌍 Your B-READY system is now accessible worldwide!
echo.
echo 📋 Next steps:
echo 1. Check the ngrok windows for your global URLs
echo 2. Copy the HTTPS URLs (https://xxxxx.ngrok.io)
echo 3. Share these URLs with anyone who needs access
echo.
echo 🔒 Security notes:
echo - URLs are secure (HTTPS)
echo - Free tier: URLs change when you restart
echo - Paid tier: Get stable URLs
echo.
echo 💡 Development notes:
echo - HMR disabled for global access (manual refresh needed)
echo - Real-time features work perfectly
echo - For development, use START B-READY-SEPARATE.bat
echo.
echo 🎯 Access your system from anywhere in the world!
echo.
echo Press any key to close this window...
pause >nul

echo.
echo 👋 Global access tunnels are running in separate windows.
echo Close the ngrok and server windows to stop the system.
echo.

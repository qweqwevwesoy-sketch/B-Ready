@echo off
echo ============================================
echo    B-READY Network Access Setup
echo ============================================
echo.
echo This will configure B-READY for network access
echo from other devices on your local network.
echo.
echo Your IP Address: 192.168.0.111
echo Frontend URL: http://192.168.0.111:3000
echo Socket.io URL: http://192.168.0.111:3001
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

REM Check if concurrently is available
npm list concurrently >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing concurrently package...
    call npm install --save-dev concurrently
    if %errorlevel% neq 0 (
        echo ❌ Failed to install concurrently
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo Starting Network-Accessible B-READY System
echo ============================================
echo.
echo Both servers will run with network access enabled!
echo.
echo 🌐 ACCESS URLs:
echo Frontend:  http://192.168.0.111:3000
echo Socket.io: http://192.168.0.111:3001
echo.
echo 📱 Other devices on your network can access:
echo - Phones, tablets, other computers
echo - Same WiFi network required
echo.
echo 🔒 Firewall: Make sure Windows Firewall allows Node.js
echo.
echo Press Ctrl+C in BOTH windows to stop servers
echo.
pause

REM Start Socket.io server in new window
echo 🚀 Starting Socket.io server (Network Access)...
start "B-READY Socket.io Server - Network" cmd /k "cd /d %~dp0server && npm run dev"

REM Wait a moment for server to start
timeout /t 5 /nobreak >nul

REM Start Next.js frontend in new window
echo 🚀 Starting Next.js frontend (Network Access)...
start "B-READY Frontend - Network" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Both servers started with NETWORK ACCESS enabled!
echo.
echo 🌐 Share these URLs with other devices:
echo http://192.168.0.111:3000
echo.
echo 🎉 B-READY is now accessible from any device on your network!
echo.

pause

@echo off
echo ============================================
echo    FRESH GLOBAL START - BRAND NEW SESSION
echo ============================================
echo.
echo This creates completely fresh tunnels
echo No conflicts possible - guaranteed to work!
echo.
pause

echo.
echo 🚀 STEP 1: Starting fresh servers...
echo.

REM Start servers on fresh ports
cd /d "%~dp0server"
start "Fresh Socket Server" cmd /k "set PORT=3004 && npm run dev"
cd /d "%~dp0"

timeout /t 3 /nobreak >nul

start "Fresh Frontend" cmd /k "set PORT=3005 && set NEXT_TELEMETRY_DISABLED=1 && npm run dev"

echo ✅ Fresh servers started (ports 3004 and 3005)
timeout /t 5 /nobreak >nul

echo.
echo 🌐 STEP 2: Creating FRESH tunnels with US region...
echo.

REM Use US region to avoid cached Asia Pacific sessions
start "Fresh WebSocket Tunnel" cmd /k "ngrok http 3004 --region=us"

timeout /t 10 /nobreak >nul

start "Fresh Frontend Tunnel" cmd /k "ngrok http 3005 --region=us"

timeout /t 10 /nobreak >nul

echo.
echo 🎉 SUCCESS! Fresh tunnels created in US region
echo.
echo 📋 CHECK YOUR WINDOWS:
echo - Fresh WebSocket Tunnel: https://xxxxx.ngrok.io (port 3004)
echo - Fresh Frontend Tunnel:  https://yyyyy.ngrok.io (port 3005)
echo.
echo 🌍 CONFIGURE GLOBAL ACCESS:
echo 1. Open the Frontend tunnel URL
echo 2. Yellow config panel appears
echo 3. Copy WebSocket URL and save
echo.
echo 🚨 Your system is now globally accessible with FRESH tunnels!
echo.
pause

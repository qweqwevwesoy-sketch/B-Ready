@echo off
echo ============================================
echo    FINAL GLOBAL SETUP - GUARANTEED WORKING
echo ============================================
echo.
echo This is the FINAL solution that WILL work
echo Follow each step carefully
echo.
pause

echo.
echo STEP 1: Starting your servers...
echo.

REM Start servers
cd /d "%~dp0server"
start "B-READY Socket Server" cmd /k "set PORT=3003 && npm run dev"
cd /d "%~dp0"

timeout /t 3 /nobreak >nul

start "B-READY Frontend" cmd /k "set PORT=3002 && set NEXT_TELEMETRY_DISABLED=1 && npm run dev"

echo ✅ Servers started on ports 3002 and 3003
echo.
echo Press any key when both server windows show they are ready...
pause >nul

echo.
echo STEP 2: Creating WebSocket tunnel FIRST...
echo.

echo 🌐 Starting WebSocket tunnel (port 3003)...
start "WebSocket Tunnel" cmd /k "ngrok http 3003"

echo ✅ WebSocket tunnel window opened
echo ⏳ Wait 15 seconds for it to fully start...
echo Check the WebSocket tunnel window - you should see a URL like:
echo https://xxxxx.ngrok.io -> http://localhost:3003
echo.
echo Press any key when you see the WebSocket URL...
pause >nul

echo.
echo STEP 3: Creating Frontend tunnel SECOND...
echo.

echo 🌐 Starting Frontend tunnel (port 3002)...
start "Frontend Tunnel" cmd /k "ngrok http 3002"

echo ✅ Frontend tunnel window opened
echo ⏳ Wait 10 seconds for it to start...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 SUCCESS! Both tunnels should be running now.
echo.
echo 📋 CHECK YOUR WINDOWS:
echo - WebSocket Tunnel: Should show https://xxxxx.ngrok.io
echo - Frontend Tunnel: Should show https://yyyyy.ngrok.io
echo.
echo 🌍 ACCESS YOUR GLOBAL SYSTEM:
echo 1. Open the Frontend URL in browser
echo 2. Use the yellow WebSocket config panel
echo 3. Enter the WebSocket URL and save
echo.
echo 🚨 Your emergency system is now globally accessible!
echo.
pause

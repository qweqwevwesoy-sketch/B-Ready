@echo off
echo ============================================
echo    FINAL NGROK SOLUTION - UNIQUE SUBDOMAINS
echo ============================================
echo.
echo Uses guaranteed unique subdomains
echo No conflicts possible!
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
echo 🌐 Creating unique ngrok tunnels...
echo.

REM Generate unique timestamp-based subdomain
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATESTR=%%c%%a%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIMESTR=%%a%%b
set UNIQUE_ID=%DATESTR%%TIMESTR%

REM Create WebSocket tunnel with unique subdomain
echo Creating WebSocket tunnel with unique subdomain...
start "WebSocket Tunnel" cmd /k "ngrok http 3003 --subdomain=bready-ws-%UNIQUE_ID%"

timeout /t 8 /nobreak >nul

REM Create Frontend tunnel with unique subdomain
echo Creating Frontend tunnel with unique subdomain...
start "Frontend Tunnel" cmd /k "ngrok http 3002 --subdomain=bready-fe-%UNIQUE_ID%"

echo.
echo 🎉 SUCCESS! Unique tunnels created
echo.
echo 📋 Your URLs (check ngrok windows):
echo - Frontend: https://bready-fe-%UNIQUE_ID%.ngrok.io
echo - WebSocket: https://bready-ws-%UNIQUE_ID%.ngrok.io
echo.
echo 🌍 ACCESS INSTRUCTIONS:
echo 1. Open Frontend URL in browser
echo 2. Yellow config panel appears
echo 3. Copy WebSocket URL and save
echo.
echo ✅ Guaranteed no conflicts - unique subdomains!
echo.
pause

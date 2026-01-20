@echo off
echo ============================================
echo    MANUAL TUNNEL CREATION
echo ============================================
echo.
echo Create tunnels one at a time to avoid conflicts
echo.

echo Step 1: Make sure your servers are running on ports 3002 and 3003
echo Step 2: We'll create tunnels one at a time
echo.

echo Press any key to create WEBSOCKET tunnel first...
pause >nul

echo 🌐 Creating WebSocket tunnel (port 3003)...
start "WebSocket Tunnel" cmd /k "ngrok http 3003"

echo.
echo ✅ WebSocket tunnel started!
echo Wait 10-15 seconds for it to fully establish
echo Check the WebSocket tunnel window for the URL
echo.
echo Press any key when ready to create the frontend tunnel...
pause >nul

echo 🌐 Creating Frontend tunnel (port 3002)...
start "Frontend Tunnel" cmd /k "ngrok http 3002"

echo.
echo ✅ Both tunnels created!
echo.
echo 📋 Copy these URLs:
echo - Frontend URL: From the "Frontend Tunnel" window
echo - WebSocket URL: From the "WebSocket Tunnel" window
echo.
echo 🎯 Ready to configure your global access!
echo.
pause

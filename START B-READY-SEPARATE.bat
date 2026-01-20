@echo off
echo ============================================
echo    B-READY Emergency Reporting System
echo    (Separate Windows - Socket.io Server)
echo ============================================
echo.
echo This will open TWO separate Command Prompt windows:
echo.
echo Window 1: Next.js Frontend (port 3000)
echo Window 2: Socket.io Server (port 3001)
echo.
echo Close both windows to stop the servers
echo.
pause

REM Start Socket.io server in new window
echo 🚀 Starting Socket.io server...
start "B-READY Socket.io Server" cmd /k "cd /d %~dp0server && npm run dev"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start Next.js frontend in new window
echo 🚀 Starting Next.js frontend...
start "B-READY Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Both servers started in separate windows!
echo.
echo Frontend: http://localhost:3000
echo Socket.io: http://localhost:3001
echo.
echo Real-time features should now work! 🎉
echo.

pause

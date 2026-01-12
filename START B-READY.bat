@echo off
echo ============================================
echo    B-READY Emergency Reporting System
echo ============================================
echo.
echo Starting B-READY system in offline mode...
echo.
echo This will start:
echo - Next.js frontend (port 3000)
echo - Socket.io server (port 3003)
echo.
echo Press Ctrl+C to stop all services
echo.
echo ============================================

REM Start the development servers concurrently
npm run dev:all

pause

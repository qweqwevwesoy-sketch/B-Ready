@echo off
echo ============================================
echo    B-READY Emergency Reporting System
echo    (Fixed - With Socket.io Server)
echo ============================================
echo.
echo Starting both servers for full functionality...
echo.
echo This will start:
echo - Next.js frontend (port 3000)
echo - Socket.io server (port 3001)
echo.
echo Press Ctrl+C to stop both servers
echo.
echo ============================================

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
        echo.
        echo Try running manually:
        echo npm install --save-dev concurrently
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Starting both servers...
echo Frontend: http://localhost:3000
echo Socket.io: http://localhost:3001
echo.

REM Start both servers
call npm run dev:all

pause

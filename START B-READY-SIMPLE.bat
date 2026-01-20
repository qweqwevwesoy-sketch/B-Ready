@echo off
echo ============================================
echo    B-READY Emergency Reporting System
echo    (Frontend Only - Simple Mode)
echo ============================================
echo.
echo Checking system requirements...
echo.

REM Check if Node.js and npm are available
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not found in PATH
    echo.
    echo 📋 Make sure Node.js and npm are installed and in your PATH
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    echo ✅ npm found
)

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found! Make sure you're in the right directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting B-READY Frontend (Simple Mode)...
echo.
echo This will start:
echo - Next.js frontend only (port 3000)
echo - Socket.io server NOT started (some features disabled)
echo - Stations will use mock data
echo.
echo Press Ctrl+C to stop
echo.
echo ============================================
echo.

REM Start only the Next.js development server
echo 🚀 Starting Next.js development server...
call npm run dev

pause

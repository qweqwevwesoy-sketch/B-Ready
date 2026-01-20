@echo off
echo ============================================
echo    B-READY Debug Startup
echo ============================================
echo.
echo This will show you exactly what's happening...
echo.
pause

REM Check if we're in the right directory
echo Current directory: %CD%
echo.
if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    echo Make sure you're running this from the b-ready-nextjs folder
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Found package.json
)

REM Check if Node.js and npm are available
echo.
echo Checking Node.js and npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm is not found in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Make sure to check "Add to PATH" during installation
    echo.
    pause
    exit /b 1
) else (
    echo ✅ npm found
)

REM Check npm version
echo.
echo Checking npm version...
call npm --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm command failed
    pause
    exit /b 1
)

REM Check if node_modules exists
echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo ⚠️  node_modules not found, installing dependencies...
    echo This might take a few minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Failed to install dependencies
        echo.
        echo Try running: npm install
        echo manually in this folder
        echo.
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

REM Check if port 3000 is available
echo.
echo Checking if port 3000 is available...
netstat -an | find "3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ WARNING: Port 3000 is already in use!
    echo.
    echo Please close any other Next.js servers first
    echo Or the port might be used by another application
    echo.
    echo Press any key to try starting anyway...
    pause
) else (
    echo ✅ Port 3000 is available
)

echo.
echo ============================================
echo Starting Next.js development server...
echo ============================================
echo.
echo If this works, you should see:
echo - Local: http://localhost:3000
echo - Ready in X seconds
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================

REM Start the development server
call npm run dev

pause

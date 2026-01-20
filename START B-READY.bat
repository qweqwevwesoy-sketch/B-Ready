@echo off
echo ============================================
echo    B-READY Emergency Reporting System
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

REM Check if concurrently is installed
npm list -g concurrently >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  concurrently not found globally, checking local installation...
)

REM Check if MariaDB/MySQL is running
echo Checking database status...
netstat -an | find "3306" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Database (MariaDB/MySQL) is NOT running on port 3306
    echo.
    echo 📋 To start the database, choose one option:
    echo.
    echo Option 1 - XAMPP (Recommended):
    echo 1. Install XAMPP from https://www.apachefriends.org/
    echo 2. Start XAMPP Control Panel as Administrator
    echo 3. Start "MySQL" module (not Apache)
    echo 4. Run this batch file again
    echo.
    echo Option 2 - WAMP:
    echo 1. Install WAMP server
    echo 2. Start WAMP
    echo 3. Ensure MySQL service is running
    echo.
    echo Option 3 - Native MariaDB/MySQL:
    echo 1. Install MariaDB/MySQL server
    echo 2. Start the service
    echo 3. Create database 'bready_offline'
    echo 4. Create user 'bready_user' with password 'bready_pass'
    echo.
    echo Press any key to continue anyway (stations will use mock data)...
    pause
) else (
    echo ✅ Database detected on port 3306
)

echo.
echo Starting B-READY system...
echo.
echo This will start:
echo - Next.js frontend (port 3000)
echo - Socket.io server (port 3003)
echo.
echo Press Ctrl+C to stop all services
echo.
echo ============================================
echo.

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

REM Check if server dependencies are installed
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

REM Start the development servers concurrently
echo 🚀 Starting development servers...
call npm run dev:all

pause

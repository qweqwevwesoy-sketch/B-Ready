@echo off
echo ============================================
echo    MANUAL GLOBAL SETUP - Step by Step
echo ============================================
echo.
echo This will guide you through manual setup
echo to ensure everything works correctly.
echo.
pause

echo.
echo 📋 MANUAL SETUP STEPS:
echo.
echo Step 1: Kill all processes manually
echo Step 2: Start servers one by one
echo Step 3: Create tunnels
echo Step 4: Test access
echo.

REM Step 1: Kill everything and clear caches
echo.
echo 🔪 STEP 1: Nuclear cleanup and cache clearing...
echo Close ALL Command Prompt windows manually!
echo Press any key when ready to continue...
pause >nul

REM Kill all processes
taskkill /F /IM ngrok.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq B-READY*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Ngrok*" >nul 2>&1

REM Clear Next.js cache to ensure fresh build
if exist ".next" (
    rd /s /q ".next" 2>nul
    echo Cleared Next.js cache
)

REM Clear ngrok cache
if exist "%APPDATA%\ngrok" (
    rd /s /q "%APPDATA%\ngrok\cache" 2>nul
    del /f /q "%APPDATA%\ngrok\*.log" 2>nul
)

echo ✅ All processes killed and caches cleared.
timeout /t 5 /nobreak >nul

REM Step 2: Start servers
echo.
echo 🚀 STEP 2: Starting servers...
echo.

echo Starting Socket.io server (port 3001)...
cd /d "%~dp0server"
start "B-READY Socket.io Server" cmd /k "npm run dev"
cd /d "%~dp0"

timeout /t 3 /nobreak >nul

echo Starting Next.js frontend (port 3000)...
start "B-READY Frontend" cmd /k "npm run dev"

echo ✅ Servers starting...
timeout /t 5 /nobreak >nul

REM Step 3: Start tunnels
echo.
echo 🌐 STEP 3: Creating tunnels...
echo.

echo Creating frontend tunnel (port 3000)...
start "Ngrok Frontend" cmd /k "ngrok http 3000"

timeout /t 3 /nobreak >nul

echo Creating WebSocket tunnel (port 3001)...
start "Ngrok WebSocket" cmd /k "ngrok http 3001"

echo.
echo ✅ Setup complete!
echo.
echo 📋 CHECK YOUR WINDOWS:
echo - B-READY Socket.io Server (should show port 3001)
echo - B-READY Frontend (should show port 3000)
echo - Ngrok Frontend (get HTTPS URL)
echo - Ngrok WebSocket (get HTTPS URL)
echo.
echo 🌍 TEST ACCESS:
echo 1. Open the frontend HTTPS URL
echo 2. Use yellow config panel for WebSocket URL
echo 3. Should work perfectly!
echo.
pause

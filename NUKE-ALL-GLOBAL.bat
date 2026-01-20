@echo off
echo ============================================
echo    NUKE ALL - COMPLETE GLOBAL RESET
echo ============================================
echo.
echo This kills EVERYTHING and starts fresh
echo Nuclear option - guaranteed clean slate
echo.
pause

echo.
echo 🔪 NUCLEAR CLEANUP STARTED...
echo.

REM Kill ALL possible processes
echo Killing all ngrok processes...
taskkill /F /IM ngrok.exe >nul 2>&1
taskkill /F /FI "IMAGENAME eq ngrok.exe" >nul 2>&1
for /f "tokens=2" %%i in ('tasklist ^| findstr ngrok') do taskkill /F /PID %%i >nul 2>&1

echo Killing all Node.js processes...
taskkill /F /IMAGENAME node.exe >nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" >nul 2>&1

echo Killing all B-READY windows...
taskkill /F /FI "WINDOWTITLE eq B-READY*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Ngrok*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Tunnel*" >nul 2>&1

REM Clear all caches
echo Clearing caches...
if exist ".next" rd /s /q ".next" >nul 2>&1
if exist "%APPDATA%\ngrok" (
    del /f /q "%APPDATA%\ngrok\*.yml" >nul 2>&1
    rd /s /q "%APPDATA%\ngrok\cache" >nul 2>&1
)

REM Wait for everything to die
timeout /t 10 /nobreak >nul

echo.
echo ✅ CLEAN SLATE ACHIEVED
echo All processes killed, caches cleared
echo.

REM Verify clean slate
echo 🔍 VERIFICATION:
tasklist /FI "IMAGENAME eq ngrok.exe" /NH | findstr ngrok >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ WARNING: Ngrok still running!
) else (
    echo ✅ No ngrok processes running
)

tasklist /FI "IMAGENAME eq node.exe" /NH | findstr node >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ WARNING: Node processes still running!
) else (
    echo ✅ No Node processes running
)

echo.
echo 🚀 STARTING FRESH SERVERS...
echo.

REM Start fresh servers
cd /d "%~dp0server"
start "Fresh Socket Server" cmd /k "set PORT=3003 && npm run dev"
cd /d "%~dp0"

timeout /t 5 /nobreak >nul

start "Fresh Frontend" cmd /k "set PORT=3002 && set NEXT_TELEMETRY_DISABLED=1 && npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo 🌐 CREATING BRAND NEW TUNNELS...
echo.

REM Create tunnels with maximum delay to ensure separation
echo Creating tunnel 1 (port 3002)...
start "Global Frontend" cmd /k "ngrok http 3002"

timeout /t 20 /nobreak >nul

echo Creating tunnel 2 (port 3003)...
start "Global WebSocket" cmd /k "ngrok http 3003"

echo.
echo 🎉 COMPLETE RESET FINISHED!
echo.
echo 📋 CHECK YOUR NEW WINDOWS:
echo - Global Frontend: Shows random ngrok.io URL
echo - Global WebSocket: Shows different random ngrok.io URL
echo.
echo 🌍 ACCESS INSTRUCTIONS:
echo 1. Open Frontend URL
echo 2. Yellow config panel appears
echo 3. Copy WebSocket URL and save
echo.
echo ✅ This should work - complete fresh start!
echo.
pause

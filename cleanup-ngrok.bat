@echo off
echo ============================================
echo    COMPLETE SYSTEM RESET - Nuclear Option
echo ============================================
echo.
echo This will NUKE everything related to B-READY
echo and ensure a completely clean slate.
echo.

REM Kill ALL possible interfering processes
echo 🔪 Nuclear cleanup initiated...

REM Kill ngrok processes with extreme prejudice
taskkill /F /IM ngrok.exe /T >nul 2>&1
taskkill /F /FI "IMAGENAME eq ngrok.exe" /T >nul 2>&1
for /f "tokens=2" %%i in ('tasklist ^| findstr ngrok') do taskkill /F /PID %%i >nul 2>&1

REM Kill ALL Node.js processes (including development servers)
taskkill /F /IMAGENAME node.exe /T >nul 2>&1
taskkill /F /FI "IMAGENAME eq node.exe" /T >nul 2>&1

REM Kill any B-READY related windows
taskkill /F /FI "WINDOWTITLE eq B-READY*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Ngrok*" /T >nul 2>&1

REM Kill any processes on ports 3000 and 3001
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%i >nul 2>&1
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3001') do taskkill /F /PID %%i >nul 2>&1

REM Wait longer for everything to die
timeout /t 8 /nobreak >nul

REM Clear ALL possible caches
echo 🧹 Clearing all caches...

REM Ngrok cache
if exist "%APPDATA%\ngrok" (
    rd /s /q "%APPDATA%\ngrok\cache" 2>nul
    del /f /q "%APPDATA%\ngrok\*.log" 2>nul
)

REM Next.js cache
if exist ".next" (
    rd /s /q ".next" 2>nul
)

REM Node modules cache (optional - uncomment if needed)
REM if exist "node_modules\.cache" rd /s /q "node_modules\.cache" 2>nul

echo Cache clearing complete.

REM Final verification
echo 🔍 Final verification...
tasklist /FI "IMAGENAME eq ngrok.exe" /NH | findstr ngrok.exe >nul
if %errorlevel% equ 0 (
    echo ❌ WARNING: Some ngrok processes still running!
    echo Please restart your computer if problems persist.
) else (
    echo ✅ All interfering processes eliminated.
)

netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ❌ WARNING: Port 3000 still in use!
) else (
    echo ✅ Port 3000 is free.
)

netstat -ano | findstr :3001 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo ❌ WARNING: Port 3001 still in use!
) else (
    echo ✅ Port 3001 is free.
)

echo.
echo 🎯 NUCLEAR CLEANUP COMPLETE
echo All processes killed, caches cleared, ports freed.
echo You can now run START B-READY-GLOBAL.bat for a fresh start.
echo.
pause

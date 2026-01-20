@echo off
echo ============================================
echo    TEST GLOBAL SETUP - Debug Version
echo ============================================
echo.
echo This will test global setup with detailed logging
echo.
pause

echo [DEBUG] Current directory: %CD%
echo [DEBUG] Checking for package.json...

if not exist "package.json" (
    echo ❌ ERROR: package.json not found!
    echo Make sure you're in the b-ready-nextjs folder
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo ✅ Found package.json

echo.
echo [DEBUG] Checking ngrok...
ngrok version
if %errorlevel% neq 0 (
    echo ❌ ERROR: ngrok not found or not working
    pause
    exit /b 1
)

echo ✅ ngrok working

echo.
echo [DEBUG] Starting simple test...
echo Press any key to continue with tunnel test...
pause

echo [DEBUG] Creating test tunnel...
start "Test Tunnel" cmd /k "ngrok http 3000"

echo.
echo ✅ Test tunnel started!
echo Check if the ngrok window opens with a URL.
echo.
echo If this works, try START B-READY-GLOBAL-SAFE.bat again.
echo If it still fails, there might be an issue with npm/node.
echo.
pause

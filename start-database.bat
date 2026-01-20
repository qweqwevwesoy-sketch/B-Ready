@echo off
echo ============================================
echo    B-READY Database Startup
echo ============================================
echo.
echo Attempting to start database services...
echo.

REM Try to start MySQL service (if installed)
echo Trying to start MySQL service...
net start mysql 2>nul
if %errorlevel% equ 0 (
    echo ✅ MySQL service started successfully
    goto :check_connection
)

REM Try to start MariaDB service (if installed)
echo Trying to start MariaDB service...
net start mariadb 2>nul
if %errorlevel% equ 0 (
    echo ✅ MariaDB service started successfully
    goto :check_connection
)

echo ❌ Could not start database service automatically
echo.
echo 📋 Manual options:
echo.
echo 1. If you have XAMPP installed:
echo    - Open XAMPP Control Panel as Administrator
echo    - Click "Start" next to MySQL
echo.
echo 2. If you have WAMP installed:
echo    - Start WAMP server
echo    - Make sure MySQL service is running
echo.
echo 3. Install XAMPP (recommended):
echo    - Download from: https://www.apachefriends.org/
echo    - Install and start MySQL module
echo.
echo 4. Continue with mock data:
echo    - The app will work with mock station data
echo    - Adding stations will show error but app works
echo.
pause
exit /b 1

:check_connection
echo.
echo Checking database connection...
timeout /t 5 /nobreak >nul

REM Check if port 3306 is listening
netstat -an | find "3306" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database is running on port 3306
    echo ✅ You can now start B-READY with START B-READY.bat
) else (
    echo ❌ Database port 3306 not detected
    echo Please check your database service status
)

echo.
pause

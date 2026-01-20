@echo off
echo.
echo ============================================
echo     B-READY - Get Your Network IP
echo ============================================
echo.
echo Your network IP addresses:
echo.
ipconfig | findstr /R /C:"IPv4 Address"
echo.
echo ============================================
echo.
echo Use the IPv4 Address above with :3000
echo Example: http://192.168.50.250:3000/
echo.
pause

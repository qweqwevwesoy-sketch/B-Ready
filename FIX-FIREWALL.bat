@echo off
echo ============================================
echo    FIX FIREWALL FOR LOCALTUNNEL
echo ============================================
echo.
echo This adds firewall rule for LocalTunnel
echo RUN THIS AS ADMINISTRATOR (Right-click -> Run as administrator)
echo.
pause

echo Adding firewall rule for LocalTunnel...
netsh advfirewall firewall add rule name="LocalTunnel Outbound" dir=out action=allow protocol=TCP remoteport=31357

echo.
echo ✅ Firewall rule added!
echo.
echo Now try LOCAL-TUNNEL-GLOBAL.bat again
echo.
pause

@echo off
echo Adding firewall rules for B-READY servers...
echo.

echo Adding rule for Next.js frontend (port 3000)...
powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\"B-READY NextJS\" dir=in action=allow protocol=TCP localport=3000' -Verb RunAs" -Wait

echo.
echo Adding rule for WebSocket server (port 3001)...
powershell -Command "Start-Process netsh -ArgumentList 'advfirewall firewall add rule name=\"B-READY WebSocket\" dir=in action=allow protocol=TCP localport=3001' -Verb RunAs" -Wait

echo.
echo Firewall rules added successfully!
echo You can now access B-READY from other devices on your network.
echo.
echo URLs:
echo - Frontend: http://192.168.0.111:3000/
echo - WebSocket: ws://192.168.0.111:3001/
echo.
pause
